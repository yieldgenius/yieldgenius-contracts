// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../../interfaces/common/IUniswapRouterETH.sol";
import "../../interfaces/beethovenx/IBalancerVault.sol";
import "../../interfaces/curve/IRewardsGauge.sol";
import "../../interfaces/curve/IStreamer.sol";
import "../../interfaces/curve/IHelper.sol";
import "../common/StratFeeManagerInitializable.sol";
import "./BalancerActionsLib.sol";
import "./YGBalancerStructs.sol";
import "../../utils/UniV3Actions.sol";

interface IBalancerPool {
    function getPoolId() external view returns (bytes32);
}

contract StrategyBalancerMultiRewardGaugeUniV3 is StratFeeManagerInitializable {
    using SafeERC20 for IERC20;

    /**
     *@notice Tokens used
     */
    address public want;
    address public output;
    address public native;

    YGBalancerStructs.Input public input;

    /**
     *@notice Third party contracts
     */
    address public rewardsGauge;

    YGBalancerStructs.BatchSwapStruct[] public nativeToInputRoute;
    YGBalancerStructs.BatchSwapStruct[] public outputToNativeRoute;
    address[] public nativeToInputAssets;
    address[] public outputToNativeAssets;

    mapping(address => YGBalancerStructs.Reward) public rewards;
    address[] public rewardTokens;

    address public uniswapRouter;

    IBalancerVault.SwapKind public swapKind = IBalancerVault.SwapKind.GIVEN_IN;
    IBalancerVault.FundManagement public funds;

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

    /**
     * @dev Initializes strategy.
     * @param _want want address
     * @param _switches switches
     * @param _nativeToInputRoute native to output routes
     * @param _outputToNativeRoute output to native routes
     * @param _assets assets addresses
     * @param _rewardsGauge rewards Gauge address
     * @param _commonAddresses  vault, unirouter, keeper, strategist, beefyFeeRecipient, beefyFeeConfig
     */
    function initialize(
        address _want,
        bool[] calldata _switches,
        YGBalancerStructs.BatchSwapStruct[] calldata _nativeToInputRoute,
        YGBalancerStructs.BatchSwapStruct[] calldata _outputToNativeRoute,
        address[][] calldata _assets,
        address _rewardsGauge,
        CommonAddresses calldata _commonAddresses
    ) public initializer {
        __StratFeeManager_init(_commonAddresses);

        for (uint i; i < _nativeToInputRoute.length; ) {
            nativeToInputRoute.push(_nativeToInputRoute[i]);
            unchecked {
                ++i;
            }
        }

        for (uint j; j < _outputToNativeRoute.length; ) {
            outputToNativeRoute.push(_outputToNativeRoute[j]);
            unchecked {
                ++j;
            }
        }

        outputToNativeAssets = _assets[0];
        nativeToInputAssets = _assets[1];
        output = outputToNativeAssets[0];
        native = nativeToInputAssets[0];
        input.input = nativeToInputAssets[nativeToInputAssets.length - 1];
        input.isComposable = _switches[0];

        funds = IBalancerVault.FundManagement(
            address(this),
            false,
            payable(address(this)),
            false
        );

        rewardsGauge = _rewardsGauge;
        input.isBeets = _switches[1];
        uniswapRouter = address(0xC1e7dFE73E1598E3910EF4C7845B68A9Ab6F4c83);

        want = _want;
        _giveAllowances();
    }

    /**
     *@notice Puts the funds to work
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
     *@notice harvests rewards
     */
    function harvest() external virtual {
        _harvest(tx.origin);
    }

    /**
     *@notice harvests rewards
     *@param callFeeRecipient fee recipient address
     */
    function harvest(address callFeeRecipient) external virtual {
        _harvest(callFeeRecipient);
    }

    /**
     *@notice harvests rewards manager only
     */
    function managerHarvest() external onlyManager {
        _harvest(tx.origin);
    }

    /**
     *@notice compounds earnings and charges performance fee
     *@param callFeeRecipient Caller address
     */
    function _harvest(address callFeeRecipient) internal whenNotPaused {
        if (!input.isBeets) {
            IStreamer streamer = IStreamer(
                IRewardsGauge(rewardsGauge).reward_contract()
            );
            streamer.get_reward();
        } else {
            address helper = address(
                0x299dcDF14350999496204c141A0c20A29d71AF3E
            );
            IHelper(helper).claimRewards(rewardsGauge, address(this));
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
     *@notice Swap rewards to Native
     */
    function swapRewardsToNative() internal {
        uint256 outputBal = IERC20(output).balanceOf(address(this));
        if (outputBal > 0) {
            IBalancerVault.BatchSwapStep[] memory _swaps = BalancerActionsLib
                .buildSwapStructArray(outputToNativeRoute, outputBal);
            BalancerActionsLib.balancerSwap(
                unirouter,
                swapKind,
                _swaps,
                outputToNativeAssets,
                funds,
                int256(outputBal)
            );
        }
        /**
         *@notice extras
         */
        for (uint i; i < rewardTokens.length; i++) {
            uint bal = IERC20(rewardTokens[i]).balanceOf(address(this));
            if (bal >= rewards[rewardTokens[i]].minAmount) {
                if (rewards[rewardTokens[i]].assets[0] != address(0)) {
                    YGBalancerStructs.BatchSwapStruct[]
                        memory swapInfo = new YGBalancerStructs.BatchSwapStruct[](
                            rewards[rewardTokens[i]].assets.length - 1
                        );
                    for (
                        uint j;
                        j < rewards[rewardTokens[i]].assets.length - 1;

                    ) {
                        swapInfo[j] = rewards[rewardTokens[i]].swapInfo[j];
                        unchecked {
                            ++j;
                        }
                    }
                    IBalancerVault.BatchSwapStep[]
                        memory _swaps = BalancerActionsLib.buildSwapStructArray(
                            swapInfo,
                            bal
                        );
                    BalancerActionsLib.balancerSwap(
                        unirouter,
                        swapKind,
                        _swaps,
                        rewards[rewardTokens[i]].assets,
                        funds,
                        int256(bal)
                    );
                } else {
                    UniV3Actions.kyberSwap(
                        uniswapRouter,
                        rewards[rewardTokens[i]].routeToNative,
                        bal
                    );
                }
            }
        }
    }

    /**
     *@notice Performance fees
     *@param callFeeRecipient Caller address
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
        uint256 nativeBal = IERC20(native).balanceOf(address(this));
        if (native != input.input) {
            IBalancerVault.BatchSwapStep[] memory _swaps = BalancerActionsLib
                .buildSwapStructArray(nativeToInputRoute, nativeBal);
            BalancerActionsLib.balancerSwap(
                unirouter,
                swapKind,
                _swaps,
                nativeToInputAssets,
                funds,
                int256(nativeBal)
            );
        }

        uint256 inputBal = IERC20(input.input).balanceOf(address(this));
        BalancerActionsLib.balancerJoin(
            unirouter,
            IBalancerPool(want).getPoolId(),
            input.input,
            inputBal
        );
    }

    /**
     *@notice Calculate the total underlaying 'want' held by the strat.
     *@return uint256 balance
     */
    function balanceOf() public view returns (uint256) {
        return balanceOfWant() + balanceOfPool();
    }

    /**
     *@notice It calculates how much 'want' this contract holds.
     *@return uint256 Balance
     */
    function balanceOfWant() public view returns (uint256) {
        return IERC20(want).balanceOf(address(this));
    }

    /**
     *@notice It calculates how much 'want' the strategy has working in the farm.
     *@return uint256 Amount
     */
    function balanceOfPool() public view returns (uint256) {
        return IRewardsGauge(rewardsGauge).balanceOf(address(this));
    }

    /**
     *@notice Rreturns rewards unharvested
     *@return uint256 Claimable rewards amount
     */
    function rewardsAvailable() public view returns (uint256) {
        return
            IRewardsGauge(rewardsGauge).claimable_reward(address(this), output);
    }

    /**
     *@notice Native reward amount for calling harvest
     *@return uint256 Native reward amount
     */
    function callReward() public pure returns (uint256) {
        return 0; // multiple swap providers with no easy way to estimate native output.
    }

    /**
     *@notice Add reward token
     *@param _token reward token
     *@param _swapInfo Swap info
     *@param _assets assets addreses
     *@param _routeToNative Route to native
     *@param _minAmount minumum amount
     */
    function addRewardToken(
        address _token,
        YGBalancerStructs.BatchSwapStruct[] memory _swapInfo,
        address[] memory _assets,
        bytes calldata _routeToNative,
        uint _minAmount
    ) external onlyOwner {
        require(_token != want, "!want");
        require(_token != native, "!native");
        if (_assets[0] != address(0)) {
            IERC20(_token).safeApprove(unirouter, 0);
            IERC20(_token).safeApprove(unirouter, type(uint).max);
        } else {
            IERC20(_token).safeApprove(uniswapRouter, 0);
            IERC20(_token).safeApprove(uniswapRouter, type(uint).max);
        }

        rewards[_token].assets = _assets;
        rewards[_token].routeToNative = _routeToNative;
        rewards[_token].minAmount = _minAmount;

        for (uint i; i < _swapInfo.length; ) {
            rewards[_token].swapInfo[i].poolId = _swapInfo[i].poolId;
            rewards[_token].swapInfo[i].assetInIndex = _swapInfo[i]
                .assetInIndex;
            rewards[_token].swapInfo[i].assetOutIndex = _swapInfo[i]
                .assetOutIndex;
            unchecked {
                ++i;
            }
        }
        rewardTokens.push(_token);
    }

    /**
     *@notice Reset reward token
     */
    function resetRewardTokens() external onlyManager {
        for (uint i; i < rewardTokens.length; ) {
            delete rewards[rewardTokens[i]];
            unchecked {
                ++i;
            }
        }
        delete rewardTokens;
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
     *@notice Called as part of strat migration. Sends all the available funds back to the vault.
     */
    function retireStrat() external {
        require(msg.sender == vault, "!vault");

        IRewardsGauge(rewardsGauge).withdraw(balanceOfPool());

        uint256 wantBal = IERC20(want).balanceOf(address(this));
        IERC20(want).transfer(vault, wantBal);
    }

    /**
     *@notice Pauses deposits and withdraws all funds from third party systems.
     */
    function panic() public onlyManager {
        pause();
        IRewardsGauge(rewardsGauge).withdraw(balanceOfPool());
    }

    /**
     *@notice pauses the strategy
     */
    function pause() public onlyManager {
        _pause();

        _removeAllowances();
    }

    /**
     *@notice unpauses the strategy
     */
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
        IERC20(output).safeApprove(unirouter, type(uint).max);
        IERC20(native).safeApprove(unirouter, type(uint).max);
        if (!input.isComposable) {
            IERC20(input.input).safeApprove(unirouter, 0);
            IERC20(input.input).safeApprove(unirouter, type(uint).max);
        }
        if (rewardTokens.length != 0) {
            for (uint i; i < rewardTokens.length; ++i) {
                if (rewards[rewardTokens[i]].assets[0] != address(0)) {
                    IERC20(rewardTokens[i]).safeApprove(unirouter, 0);
                    IERC20(rewardTokens[i]).safeApprove(
                        unirouter,
                        type(uint).max
                    );
                } else {
                    IERC20(rewardTokens[i]).safeApprove(uniswapRouter, 0);
                    IERC20(rewardTokens[i]).safeApprove(
                        uniswapRouter,
                        type(uint).max
                    );
                }
            }
        }
    }

    /**
     *@notice Remove all allowances
     */
    function _removeAllowances() internal {
        IERC20(want).safeApprove(rewardsGauge, 0);
        IERC20(output).safeApprove(unirouter, 0);
        IERC20(native).safeApprove(unirouter, 0);
        if (!input.isComposable) {
            IERC20(input.input).safeApprove(unirouter, 0);
        }
        if (rewardTokens.length != 0) {
            for (uint i; i < rewardTokens.length; ++i) {
                if (rewards[rewardTokens[i]].assets[0] != address(0)) {
                    IERC20(rewardTokens[i]).safeApprove(unirouter, 0);
                } else {
                    IERC20(rewardTokens[i]).safeApprove(uniswapRouter, 0);
                }
            }
        }
    }
}
