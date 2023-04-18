// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../../interfaces/common/IUniswapRouterETH.sol";
import "../../interfaces/common/IUniswapV2Pair.sol";
import "../../interfaces/common/IWrappedNative.sol";
import "../../interfaces/zyber/IZyberChef.sol";
import "../common/StratFeeManager.sol";
import "../../utils/GasThrottler.sol";
import "../../interfaces/common/ISwapRouter.sol";
import "../../interfaces/common/IHyperVisor.sol";
import "../../interfaces/common/IUniproxy.sol";
import "../../interfaces/common/FullMath.sol";
import "hardhat/console.sol";

contract StrategyZyberMultiRewardsGamma is StratFeeManager, GasThrottler {
    using SafeERC20 for IERC20;

    /**
     *@notice Tokens used
     */
    address public native;
    address public output;
    address public want;
    address public lpToken0;
    address public lpToken1;
    address public uniProxy;

    /**
     *@notice Third party contracts
     */
    address public chef;
    uint256 public poolId;

    bool public harvestOnDeposit;
    uint256 public lastHarvest;

    /**
     *@notice Routes
     */
    address[] public outputToNativeRoute;
    address[] public outputToLp0Route;
    address[] public outputToLp1Route;
    address[][] public rewardToOutputRoute;

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
     * @param _poolId pool id number
     * @param _chef chef address
     * @param _commonAddresses vault, unirouter, keeper, strategist, beefyFeeRecipient, beefyFeeConfig
     * @param _outputToNativeRoute ouput to native route
     * @param _outputToLp0Route ouput to lp0 route
     * @param _outputToLp1Route output to lp1 route
     */
    constructor(
        address _want,
        uint256 _poolId,
        address _chef,
        CommonAddresses memory _commonAddresses,
        address[] memory _outputToNativeRoute,
        address[] memory _outputToLp0Route,
        address[] memory _outputToLp1Route,
        address _uniproxy
    ) StratFeeManager(_commonAddresses) {
        want = _want;
        poolId = _poolId;
        chef = _chef;
        uniProxy = _uniproxy;
        output = _outputToNativeRoute[0];
        native = _outputToNativeRoute[_outputToNativeRoute.length - 1];
        outputToNativeRoute = _outputToNativeRoute;

        /**
         *@notice Setup lp routing
         */
        lpToken0 = IUniswapV2Pair(want).token1();
        require(
            _outputToLp0Route[0] == output,
            "outputToLp0Route[0] != output"
        );
        require(
            _outputToLp0Route[_outputToLp0Route.length - 1] == lpToken0,
            "outputToLp0Route[last] != lpToken0"
        );
        outputToLp0Route = _outputToLp0Route;

        lpToken1 = IUniswapV2Pair(want).token0();
        require(
            _outputToLp1Route[0] == output,
            "outputToLp1Route[0] != output"
        );
        require(
            _outputToLp1Route[_outputToLp1Route.length - 1] == lpToken1,
            "outputToLp1Route[last] != lpToken1"
        );
        outputToLp1Route = _outputToLp1Route;

        _giveAllowances();
    }

    /**
     *@notice Puts the funds to work
     */
    function deposit() public whenNotPaused {
        uint256 wantBal = IERC20(want).balanceOf(address(this));

        if (wantBal > 0) {
            IZyberChef(chef).deposit(poolId, wantBal);
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
            IZyberChef(chef).withdraw(poolId, _amount - wantBal);
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
    function beforeDeposit() external virtual override {
        if (harvestOnDeposit) {
            require(msg.sender == vault, "!vault");
            _harvest(tx.origin);
        }
    }

    /**
     *@notice harvests rewards
     */
    function harvest() external virtual gasThrottle {
        _harvest(tx.origin);
    }

    /**
     *@notice harvests rewards
     *@param callFeeRecipient fee recipient address
     */
    function harvest(address callFeeRecipient) external virtual gasThrottle {
        _harvest(callFeeRecipient);
    }

    /**
     *@notice harvests rewards manager only
     */
    function managerHarvest() external onlyManager {
        _harvest(tx.origin);
    }

    /**
     * @notice Compounds earnings and charges performance fee
     * *@param callFeeRecipient Caller address
     */
    function _harvest(address callFeeRecipient) internal whenNotPaused {
        IZyberChef(chef).deposit(poolId, 0);
        uint256 outputBal = IERC20(output).balanceOf(address(this));
        if (outputBal > 0) {
            // chargeFees(callFeeRecipient);
            addLiquidity();
            uint256 wantHarvested = balanceOfWant();
            deposit();

            lastHarvest = block.timestamp;
            emit StratHarvest(msg.sender, wantHarvested, balanceOf());
        }
    }

    /**
     *@notice Performance fees
     *@param callFeeRecipient Caller address
     */
    function chargeFees(address callFeeRecipient) internal {
        IFeeConfig.FeeCategory memory fees = getFees();
        if (rewardToOutputRoute.length != 0) {
            for (uint256 i; i < rewardToOutputRoute.length; ) {
                if (rewardToOutputRoute[i][0] == native) {
                    uint256 unwrappedBal = address(this).balance;
                    if (unwrappedBal > 0) {
                        IWrappedNative(native).deposit{value: unwrappedBal}();
                    }
                }
                uint256 rewardBal = IERC20(rewardToOutputRoute[i][0]).balanceOf(
                    address(this)
                );
                if (rewardBal > 0) {
                    IUniswapRouterETH(unirouter).swapExactTokensForTokens(
                        rewardBal,
                        0,
                        rewardToOutputRoute[i],
                        address(this),
                        block.timestamp
                    );
                }
                unchecked {
                    ++i;
                }
            }
        }

        uint256 toNative = (IERC20(output).balanceOf(address(this)) *
            fees.total) / DIVISOR;

        ISwapRouter.ExactInputParams memory params = ISwapRouter
            .ExactInputParams({
                path: abi.encodePacked(outputToNativeRoute),
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: toNative,
                amountOutMinimum: 0
            });
        ISwapRouter(unirouter).exactInput(params);

        uint256 nativeBal = IERC20(native).balanceOf(address(this));

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
        uint256 total0;
        uint256 total1;
        (total0, total1) = IHyperVisor(want).getTotalAmounts();
        console.log("total amounts");
        uint256 sqrtPriceX96 = IUniproxy(uniProxy).getSqrtTwapX96(want, 1);
        uint256 outputBal = IERC20(output).balanceOf(address(this));
        // uint256 price = (sqrtPriceX96 * sqrtPriceX96) / (2 ** (96 * 2));

        uint256 price = FullMath.mulDiv(
            uint256(sqrtPriceX96) * uint256(sqrtPriceX96),
            1e18,
            2 ** (96 * 2)
        );
        console.log("price", price);
        uint256 amount0InToken1 = price * total0;
        console.log("amount0InToken1", amount0InToken1);
        uint256 totalAmountInToken1 = total1 + amount0InToken1;
        console.log("totalAmountInToken1", totalAmountInToken1);
        uint256 inputAmount = outputBal *
            (1 - (amount0InToken1 / totalAmountInToken1));
        console.log("inputAmount", inputAmount);
        console.log("outputBal", outputBal);
        uint256 received;
        if (lpToken0 != output) {
            console.log("first");
            ISwapRouter.ExactInputParams memory params = ISwapRouter
                .ExactInputParams({
                    path: abi.encodePacked(outputToLp0Route),
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountIn: outputBal,
                    amountOutMinimum: 0
                });
            received = ISwapRouter(unirouter).exactInput(params);
        }

        if (lpToken1 != output) {
            console.log("second");
            ISwapRouter.ExactInputParams memory params = ISwapRouter
                .ExactInputParams({
                    path: abi.encodePacked(outputToLp1Route),
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountIn: inputAmount,
                    amountOutMinimum: 0
                });
            received = ISwapRouter(unirouter).exactInput(params);
        }
        console.log("received", received);
        outputBal = IERC20(output).balanceOf(address(this));
        uint256[] memory amounts = new uint256[](4);
        amounts[0] = 0;
        amounts[1] = 0;
        amounts[2] = 0;
        amounts[3] = 0;
        IUniproxy(uniProxy).deposit(
            outputBal,
            received,
            address(this),
            want,
            amounts
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
        (uint256 _amount, , , ) = IZyberChef(chef).userInfo(
            poolId,
            address(this)
        );
        return _amount;
    }

    /**
     *@notice Rreturns rewards unharvested
     *@return uint256 Amount rewards unharvested
     */
    function rewardsAvailable()
        public
        view
        returns (address[] memory, uint256[] memory)
    {
        (address[] memory addresses, , , uint256[] memory amounts) = IZyberChef(
            chef
        ).pendingTokens(poolId, address(this));
        return (addresses, amounts);
    }

    /**
     *@notice Native reward amount for calling harvest
     *@return uint256 Native reward amount
     */
    function callReward() public view returns (uint256) {
        IFeeConfig.FeeCategory memory fees = getFees();
        (
            address[] memory rewardAdd,
            uint256[] memory rewardBal
        ) = rewardsAvailable();
        uint256 nativeBal;
        try
            IUniswapRouterETH(unirouter).getAmountsOut(
                rewardBal[0],
                outputToNativeRoute
            )
        returns (uint256[] memory amountOut) {
            nativeBal = amountOut[amountOut.length - 1];
        } catch {}

        if (rewardToOutputRoute.length != 0) {
            for (uint256 i; i < rewardToOutputRoute.length; ) {
                for (uint256 j = 1; j < rewardAdd.length; ) {
                    if (rewardAdd[j] == rewardToOutputRoute[i][0]) {
                        try
                            IUniswapRouterETH(unirouter).getAmountsOut(
                                rewardBal[j],
                                rewardToOutputRoute[i]
                            )
                        returns (uint256[] memory initialAmountOut) {
                            uint256 outputBal = initialAmountOut[
                                initialAmountOut.length - 1
                            ];
                            try
                                IUniswapRouterETH(unirouter).getAmountsOut(
                                    outputBal,
                                    outputToNativeRoute
                                )
                            returns (uint256[] memory finalAmountOut) {
                                nativeBal =
                                    nativeBal +
                                    finalAmountOut[finalAmountOut.length - 1];
                            } catch {}
                        } catch {}
                    }
                    unchecked {
                        ++j;
                    }
                }
                unchecked {
                    ++i;
                }
            }
        }

        return (((nativeBal * fees.total) / DIVISOR) * fees.call) / DIVISOR;
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
     *@notice Set should gas throttle true/false
     *@param _shouldGasThrottle true/false
     */
    function setShouldGasThrottle(
        bool _shouldGasThrottle
    ) external onlyManager {
        shouldGasThrottle = _shouldGasThrottle;
    }

    /**
     *@notice Called as part of strat migration. Sends all the available funds back to the vault.
     */
    function retireStrat() external {
        require(msg.sender == vault, "!vault");

        IZyberChef(chef).emergencyWithdraw(poolId);

        uint256 wantBal = IERC20(want).balanceOf(address(this));
        IERC20(want).transfer(vault, wantBal);
    }

    /**
     *@notice Pauses deposits and withdraws all funds from third party systems.
     */
    function panic() public onlyManager {
        pause();
        IZyberChef(chef).emergencyWithdraw(poolId);
    }

    /**
     *@notice pauses strategy
     */
    function pause() public onlyManager {
        _pause();

        _removeAllowances();
    }

    /**
     *@notice unpauses strategy
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
        IERC20(want).safeApprove(chef, type(uint256).max);
        IERC20(output).safeApprove(unirouter, type(uint256).max);

        IERC20(lpToken0).safeApprove(unirouter, 0);
        IERC20(lpToken0).safeApprove(unirouter, type(uint256).max);

        IERC20(lpToken1).safeApprove(unirouter, 0);
        IERC20(lpToken1).safeApprove(unirouter, type(uint256).max);

        if (rewardToOutputRoute.length != 0) {
            for (uint256 i; i < rewardToOutputRoute.length; ) {
                IERC20(rewardToOutputRoute[i][0]).safeApprove(unirouter, 0);
                IERC20(rewardToOutputRoute[i][0]).safeApprove(
                    unirouter,
                    type(uint256).max
                );
                unchecked {
                    ++i;
                }
            }
        }
    }

    /**
     *@notice Remove all allowances
     */
    function _removeAllowances() internal {
        IERC20(want).safeApprove(chef, 0);
        IERC20(output).safeApprove(unirouter, 0);

        IERC20(lpToken0).safeApprove(unirouter, 0);
        IERC20(lpToken1).safeApprove(unirouter, 0);

        if (rewardToOutputRoute.length != 0) {
            for (uint256 i; i < rewardToOutputRoute.length; ) {
                IERC20(rewardToOutputRoute[i][0]).safeApprove(unirouter, 0);
                unchecked {
                    ++i;
                }
            }
        }
    }

    /**
     *@notice Add reward route
     *@param _rewardToOutputRoute Reward ti output route
     */
    function addRewardRoute(
        address[] memory _rewardToOutputRoute
    ) external onlyOwner {
        IERC20(_rewardToOutputRoute[0]).safeApprove(unirouter, 0);
        IERC20(_rewardToOutputRoute[0]).safeApprove(
            unirouter,
            type(uint256).max
        );
        rewardToOutputRoute.push(_rewardToOutputRoute);
    }

    /**
     *@notice Remove last reward route
     */
    function removeLastRewardRoute() external onlyManager {
        address reward = rewardToOutputRoute[rewardToOutputRoute.length - 1][0];
        if (reward != lpToken0 && reward != lpToken1) {
            IERC20(reward).safeApprove(unirouter, 0);
        }
        rewardToOutputRoute.pop();
    }

    /**
     *@notice Get output to native route
     *@return address Output to native route addresses
     */
    function outputToNative() external view returns (address[] memory) {
        return outputToNativeRoute;
    }

    /**
     *@notice Get Output to Lp0 route addresses
     *@return address Output to lp0 address
     */
    function outputToLp0() external view returns (address[] memory) {
        return outputToLp0Route;
    }

    /**
     *@notice Get Output to Lp1 route addresses
     *@return address Output to lp1 route addresses
     */
    function outputToLp1() external view returns (address[] memory) {
        return outputToLp1Route;
    }

    /**
     *@notice Get reward to output route addresses
     *@return address Reward to lp1 route addresses
     */
    function rewardToOutput() external view returns (address[][] memory) {
        return rewardToOutputRoute;
    }

    receive() external payable {}
}
