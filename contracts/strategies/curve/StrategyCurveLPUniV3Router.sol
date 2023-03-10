// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../../interfaces/common/IUniswapRouterV3.sol";
import "../../interfaces/common/IWrappedNative.sol";
import "../../interfaces/curve/ICurveSwap.sol";
import "../../interfaces/curve/IGaugeFactory.sol";
import "../../interfaces/curve/IRewardsGauge.sol";
import "../common/StratFeeManager.sol";
import "../../utils/GasThrottler.sol";
import "../../utils/Path.sol";
import "../../utils/UniV3Actions.sol";

contract StrategyCurveLPUniV3Router is StratFeeManager, GasThrottler {
    using Path for bytes;
    using SafeERC20 for IERC20;

    /**
     *@notice Tokens used
     */
    address public want; // curve lpToken
    address public crv;
    address public native;
    address public depositToken;

    /**
     *@notice Third party contracts
     */
    address public gaugeFactory;
    address public rewardsGauge;
    address public pool;
    uint public poolSize;
    uint public depositIndex;
    bool public useUnderlying;
    bool public useMetapool;

    /**
     *@notice Uniswap V3 routes
     */
    bytes public crvToNativePath;
    bytes public nativeToDepositPath;

    struct Reward {
        address token;
        bytes toNativePath;
        /**
         *@notice minimum amount to be swapped to native
         */
        uint minAmount;
    }

    Reward[] public rewards;

    /**
     *@notice if no CRV rewards yet, can enable later with custom router
     */
    bool public crvEnabled = true;
    address public crvRouter;

    /**
     *@notice if depositToken should be sent as unwrapped native
     */
    bool public depositNative;

    bool public harvestOnDeposit;
    uint256 public lastHarvest;

    event StratHarvest(
        address indexed harvester,
        uint256 wantHarvested,
        uint256 tvl
    );
    event Deposit(uint256 tvl);
    event Withdraw(uint256 tvl);
    event ChargedFees(
        uint256 callFees,
        uint256 beefyFees,
        uint256 strategistFees
    );

    constructor(
        address _want,
        address _gaugeFactory,
        address _gauge,
        address _pool,
        /**
         *@notice [poolSize, depositIndex, useUnderlying, useMetapool]
         */
        uint[] memory _params,
        /**
         *@notice [crvToNativePath, nativeToDepositPath]
         */
        bytes[] memory _paths,
        CommonAddresses memory _commonAddresses
    ) StratFeeManager(_commonAddresses) {
        want = _want;
        gaugeFactory = _gaugeFactory;
        rewardsGauge = _gauge;
        pool = _pool;
        poolSize = _params[0];
        depositIndex = _params[1];
        useUnderlying = _params[2] > 0;
        useMetapool = _params[3] > 0;

        /**
         *@notice crvToNative
         */
        address[] memory route = _pathToRoute(_paths[0]);
        crv = route[0];
        native = route[route.length - 1];
        crvToNativePath = _paths[0];
        crvRouter = unirouter;

        /**
         *@notice nativeToDeposit
         */
        route = _pathToRoute(_paths[1]);
        require(route[0] == native, "_nativeToDeposit[0] != native");
        depositToken = route[route.length - 1];
        nativeToDepositPath = _paths[1];

        if (gaugeFactory != address(0)) {
            harvestOnDeposit = true;
            withdrawalFee = 0;
        }

        _giveAllowances();
    }

    /**
     *@notice puts the funds to work
     */
    function deposit() public whenNotPaused {
        uint256 wantBal = IERC20(want).balanceOf(address(this));

        if (wantBal > 0) {
            IRewardsGauge(rewardsGauge).deposit(wantBal);
            emit Deposit(balanceOf());
        }
    }

    /**
     *@notice Withdraw for amount
     *@param _amount Withdraw amount
     */
    function withdraw(uint256 _amount) external {
        require(msg.sender == vault, "!vault");

        uint256 wantBal = IERC20(want).balanceOf(address(this));

        if (wantBal < _amount) {
            IRewardsGauge(rewardsGauge).withdraw(_amount - wantBal);
            wantBal = IERC20(want).balanceOf(address(this));
        }

        if (wantBal > _amount) {
            wantBal = _amount;
        }

        if (tx.origin != owner() && !paused()) {
            uint256 withdrawalFeeAmount = (wantBal * withdrawalFee) /
                WITHDRAWAL_MAX;
            wantBal = wantBal - withdrawalFeeAmount;
        }

        IERC20(want).safeTransfer(vault, wantBal);

        emit Withdraw(balanceOf());
    }

    /**
     *@notice Harvest on deposit check
     */
    function beforeDeposit() external override {
        if (harvestOnDeposit) {
            require(msg.sender == vault, "!vault");
            _harvest(tx.origin);
        }
    }

    /**
     *@notice harvests the rewards
     */
    function harvest() external virtual gasThrottle {
        _harvest(tx.origin);
    }

    /**
     *@notice  harvests the rewards
     *@param callFeeRecipient fee recipient address
     */
    function harvest(address callFeeRecipient) external virtual gasThrottle {
        _harvest(callFeeRecipient);
    }

    function managerHarvest() external onlyManager {
        _harvest(tx.origin);
    }

    /**
     *@notice Compounds earnings and charges performance fee
     *@param callFeeRecipient Caller address
     */
    function _harvest(address callFeeRecipient) internal whenNotPaused {
        if (gaugeFactory != address(0)) {
            IGaugeFactory(gaugeFactory).mint(rewardsGauge);
        }
        IRewardsGauge(rewardsGauge).claim_rewards(address(this));
        swapRewardsToNative();
        uint256 nativeBal = IERC20(native).balanceOf(address(this));
        if (nativeBal > 0) {
            chargeFees(callFeeRecipient);
            addLiquidity();
            uint256 wantHarvested = balanceOfWant();
            deposit();
            lastHarvest = block.timestamp;
            emit StratHarvest(msg.sender, wantHarvested, balanceOf());
        }
    }

    /**
     *@notice Swap
     *@param _path path
     *@param _amount Amount
     */
    function _swapV3(
        bytes memory _path,
        uint256 _amount
    ) internal returns (uint256 amountOut) {
        return UniV3Actions.swapV3WithDeadline(unirouter, _path, _amount);
    }

    /**
     *@notice Swap rewards to Native
     */
    function swapRewardsToNative() internal {
        uint256 crvBal = IERC20(crv).balanceOf(address(this));
        if (crvEnabled && crvBal > 0) {
            UniV3Actions.swapV3WithDeadline(crvRouter, crvToNativePath, crvBal);
        }
        /**
         *@notice extras
         */
        for (uint i; i < rewards.length; i++) {
            uint bal = IERC20(rewards[i].token).balanceOf(address(this));
            if (bal >= rewards[i].minAmount) {
                _swapV3(rewards[i].toNativePath, bal);
            }
        }
    }

    /**
     *@notice performance fees
     *@param callFeeRecipient caller fee recipient address
     */
    function chargeFees(address callFeeRecipient) internal {
        IFeeConfig.FeeCategory memory fees = getFees();
        uint256 nativeBal = (IERC20(native).balanceOf(address(this)) *
            fees.total) / DIVISOR;

        uint256 callFeeAmount = (nativeBal * fees.call) / DIVISOR;
        IERC20(native).safeTransfer(callFeeRecipient, callFeeAmount);

        uint256 beefyFeeAmount = (nativeBal * fees.beefy) / DIVISOR;
        IERC20(native).safeTransfer(beefyFeeRecipient, beefyFeeAmount);

        uint256 strategistFeeAmount = (nativeBal * fees.strategist) / DIVISOR;
        IERC20(native).safeTransfer(strategist, strategistFeeAmount);

        emit ChargedFees(callFeeAmount, beefyFeeAmount, strategistFeeAmount);
    }

    /**
     *@notice Adds liquidity to AMM and gets more LP tokens.
     */
    function addLiquidity() internal {
        uint256 depositBal;
        uint256 depositNativeAmount;
        uint256 nativeBal = IERC20(native).balanceOf(address(this));
        if (depositToken != native) {
            _swapV3(nativeToDepositPath, nativeBal);
            depositBal = IERC20(depositToken).balanceOf(address(this));
        } else {
            depositBal = nativeBal;
            if (depositNative) {
                depositNativeAmount = nativeBal;
                IWrappedNative(native).withdraw(depositNativeAmount);
            }
        }

        if (poolSize == 2) {
            uint256[2] memory amounts;
            amounts[depositIndex] = depositBal;
            if (useUnderlying) ICurveSwap(pool).add_liquidity(amounts, 0, true);
            else
                ICurveSwap(pool).add_liquidity{value: depositNativeAmount}(
                    amounts,
                    0
                );
        } else if (poolSize == 3) {
            uint256[3] memory amounts;
            amounts[depositIndex] = depositBal;
            if (useUnderlying) ICurveSwap(pool).add_liquidity(amounts, 0, true);
            else if (useMetapool)
                ICurveSwap(pool).add_liquidity(want, amounts, 0);
            else ICurveSwap(pool).add_liquidity(amounts, 0);
        } else if (poolSize == 4) {
            uint256[4] memory amounts;
            amounts[depositIndex] = depositBal;
            if (useMetapool) ICurveSwap(pool).add_liquidity(want, amounts, 0);
            else ICurveSwap(pool).add_liquidity(amounts, 0);
        } else if (poolSize == 5) {
            uint256[5] memory amounts;
            amounts[depositIndex] = depositBal;
            ICurveSwap(pool).add_liquidity(amounts, 0);
        }
    }

    function addRewardToken(
        bytes memory _rewardToNativePath,
        uint _minAmount
    ) external onlyOwner {
        address[] memory _rewardToNativeRoute = _pathToRoute(
            _rewardToNativePath
        );
        address token = _rewardToNativeRoute[0];
        require(token != want, "!want");
        require(token != rewardsGauge, "!gauge");

        rewards.push(Reward(token, _rewardToNativePath, _minAmount));
        IERC20(token).safeApprove(unirouter, 0);
        IERC20(token).safeApprove(unirouter, type(uint).max);
    }

    function resetRewardTokens() external onlyManager {
        delete rewards;
    }

    /**
     *@notice calculate the total underlaying 'want' held by the strat.
     *@return uint256 balance
     */
    function balanceOf() public view returns (uint256) {
        return balanceOfWant() + balanceOfPool();
    }

    /**
     *@notice it calculates how much 'want' this contract holds.
     *@return uint256 balance
     */
    function balanceOfWant() public view returns (uint256) {
        return IERC20(want).balanceOf(address(this));
    }

    /**
     *@notice it calculates how much 'want' the strategy has working in the farm.
     *@return uint256 balance
     */
    function balanceOfPool() public view returns (uint256) {
        return IRewardsGauge(rewardsGauge).balanceOf(address(this));
    }

    /**
     *@notice gets the path to route
     *@param _path Path
     */
    function _pathToRoute(
        bytes memory _path
    ) internal pure returns (address[] memory) {
        uint numPools = _path.numPools();
        address[] memory route = new address[](numPools + 1);
        for (uint i; i < numPools; i++) {
            (address tokenA, address tokenB, ) = _path.decodeFirstPool();
            route[i] = tokenA;
            route[i + 1] = tokenB;
            _path = _path.skipToken();
        }
        return route;
    }

    /**
     *@notice gets CRV to native address
     *@return address address route
     */
    function crvToNative() external view returns (address[] memory) {
        return _pathToRoute(crvToNativePath);
    }

    /**
     *@notice gets native to deposit
     *@return address address route
     */
    function nativeToDeposit() external view returns (address[] memory) {
        return _pathToRoute(nativeToDepositPath);
    }

    /**
     *@notice gets reward to native
     *@return address address route
     */
    function rewardToNative() external view returns (address[] memory) {
        return _pathToRoute(rewards[0].toNativePath);
    }

    /**
     *@notice gets native to deposit
     *@param i index
     *@return address address route
     */
    function rewardToNative(uint i) external view returns (address[] memory) {
        return _pathToRoute(rewards[i].toNativePath);
    }

    /**
     *@notice gets rewards length
     *@return uint length
     */
    function rewardsLength() external view returns (uint) {
        return rewards.length;
    }

    /**
     *@notice sets CRV enabled
     *@param _enabled true/false
     */
    function setCrvEnabled(bool _enabled) external onlyManager {
        crvEnabled = _enabled;
    }

    /**
     *@notice sets CRV route
     *@param _router router address
     *@param _crvToNativePath CRV to native path
     */
    function setCrvRoute(
        address _router,
        bytes memory _crvToNativePath
    ) external onlyManager {
        address[] memory _crvToNative = _pathToRoute(_crvToNativePath);
        require(_crvToNative[0] == crv, "!crv");
        require(_crvToNative[_crvToNative.length - 1] == native, "!native");

        _removeAllowances();
        crvToNativePath = _crvToNativePath;
        crvRouter = _router;
        _giveAllowances();
    }

    /**
     *@notice Set deposit native true/false
     *@param _depositNative true/false
     */
    function setDepositNative(bool _depositNative) external onlyOwner {
        depositNative = _depositNative;
    }

    /**
     *@notice Set harvest on deposit true/false
     *@param _harvestOnDeposit true/false
     */
    function setHarvestOnDeposit(bool _harvestOnDeposit) external onlyManager {
        harvestOnDeposit = _harvestOnDeposit;
        if (harvestOnDeposit) {
            setWithdrawalFee(0);
        } else {
            setWithdrawalFee(10);
        }
    }

    /**
     *@notice returns rewards unharvested
     *@return uint256 unharvested rewards
     */
    function rewardsAvailable() public view returns (uint256) {
        return IRewardsGauge(rewardsGauge).claimable_reward(address(this), crv);
    }

    /**
     *@notice native reward amount for calling harvest
     *@notice NO "view" functions in Uniswap V3 to quote amounts
     *@notice Curve rewardsAvailable() also returns 0 most of the time
     */
    function callReward() public pure returns (uint256) {
        return 0;
    }

    function setShouldGasThrottle(
        bool _shouldGasThrottle
    ) external onlyManager {
        shouldGasThrottle = _shouldGasThrottle;
    }

    /**
     *@notice called as part of strat migration. Sends all the available funds back to the vault.
     */
    function retireStrat() external {
        require(msg.sender == vault, "!vault");

        IRewardsGauge(rewardsGauge).withdraw(balanceOfPool());

        uint256 wantBal = IERC20(want).balanceOf(address(this));
        IERC20(want).transfer(vault, wantBal);
    }

    /**
     *@notice pauses deposits and withdraws all funds from third party systems.
     */
    function panic() public onlyManager {
        pause();
        IRewardsGauge(rewardsGauge).withdraw(balanceOfPool());
    }

    function pause() public onlyManager {
        _pause();

        _removeAllowances();
    }

    function unpause() external onlyManager {
        _unpause();

        _giveAllowances();

        deposit();
    }

    /**
     *@notice Give all allowances
     */
    function _giveAllowances() internal {
        IERC20(want).safeApprove(rewardsGauge, type(uint).max);
        IERC20(native).safeApprove(unirouter, type(uint).max);
        IERC20(crv).safeApprove(crvRouter, type(uint).max);
        IERC20(depositToken).safeApprove(pool, type(uint).max);
    }

    /**
     *@notice Remove all allowances
     */
    function _removeAllowances() internal {
        IERC20(want).safeApprove(rewardsGauge, 0);
        IERC20(native).safeApprove(unirouter, 0);
        IERC20(crv).safeApprove(crvRouter, 0);
        IERC20(depositToken).safeApprove(pool, 0);
    }

    receive() external payable {}
}
