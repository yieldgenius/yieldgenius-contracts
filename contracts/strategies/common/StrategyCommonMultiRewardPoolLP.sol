// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "../../interfaces/common/IUniswapRouterETH.sol";
import "../../interfaces/common/IUniswapV2Pair.sol";
import "../../interfaces/common/IMultiRewardPool.sol";
import "./StratManager.sol";
import "./FeeManager.sol";
import "../../utils/GasThrottler.sol";

contract StrategyCommonMultiRewardPoolLP is
    StratManager,
    FeeManager,
    GasThrottler
{
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    /**
     *@notice Tokens used
     */
    address public native;
    address public output;
    address public secondOutput;
    address public want;
    address public lpToken0;
    address public lpToken1;

    /**
     *@notice Third party contracts
     */
    address public rewardPool;

    bool public harvestOnDeposit;
    uint256 public lastHarvest;

    /**
     *@notice Routes
     */
    address[] public outputToNativeRoute;
    address[] public outputToLp0Route;
    address[] public outputToLp1Route;
    address[] public secondOutputToOutputRoute;

    event StratHarvest(
        address indexed harvester,
        uint256 wantHarvested,
        uint256 tvl
    );
    event Deposit(uint256 tvl);
    event Withdraw(uint256 tvl);

    /**
     * @dev Initializes strategy.
     * @param _want want address
     * @param _rewardPool reward pool address
     * @param _vault vault address
     * @param _unirouter unirouter address
     * @param _keeper keeper address
     * @param _strategist strategist address
     * @param _beefyFeeRecipient  beefy fee recipient address
     * @param _secondOutputToOutputRoute second output to output route
     * @param _outputToLp0Route ouput to lp0 route
     * @param _outputToLp1Route output to lp1 route
     */
    constructor(
        address _want,
        address _rewardPool,
        address _vault,
        address _unirouter,
        address _keeper,
        address _strategist,
        address _beefyFeeRecipient,
        address[] memory _outputToNativeRoute,
        address[] memory _secondOutputToOutputRoute,
        address[] memory _outputToLp0Route,
        address[] memory _outputToLp1Route
    )
        StratManager(
            _keeper,
            _strategist,
            _unirouter,
            _vault,
            _beefyFeeRecipient
        )
    {
        want = _want;
        rewardPool = _rewardPool;

        output = _outputToNativeRoute[0];
        native = _outputToNativeRoute[_outputToNativeRoute.length - 1];
        outputToNativeRoute = _outputToNativeRoute;

        secondOutput = _secondOutputToOutputRoute[0];
        require(
            _secondOutputToOutputRoute[_secondOutputToOutputRoute.length - 1] ==
                output,
            "secondOutputToOutputRoute[last] != output"
        );
        secondOutputToOutputRoute = _secondOutputToOutputRoute;

        /**
         *@notice Setup lp routing
         */

        lpToken0 = IUniswapV2Pair(want).token0();
        require(
            _outputToLp0Route[0] == output,
            "outputToLp0Route[0] != output"
        );
        require(
            _outputToLp0Route[_outputToLp0Route.length - 1] == lpToken0,
            "outputToLp0Route[last] != lpToken0"
        );
        outputToLp0Route = _outputToLp0Route;

        lpToken1 = IUniswapV2Pair(want).token1();
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
        uint256 wantBal = balanceOfWant();

        if (wantBal > 0) {
            IMultiRewardPool(rewardPool).stake(wantBal);
            emit Deposit(balanceOf());
        }
    }

    /**
     *@notice Withdraw for amount
     *@param _amount Withdraw amount
     */
    function withdraw(uint256 _amount) external {
        require(msg.sender == vault, "!vault");

        uint256 wantBal = balanceOfWant();

        if (wantBal < _amount) {
            IMultiRewardPool(rewardPool).withdraw(_amount.sub(wantBal));
            wantBal = balanceOfWant();
        }

        if (wantBal > _amount) {
            wantBal = _amount;
        }

        if (tx.origin != owner() && !paused()) {
            uint256 withdrawalFeeAmount = wantBal.mul(withdrawalFee).div(
                WITHDRAWAL_MAX
            );
            wantBal = wantBal.sub(withdrawalFeeAmount);
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
     *@notice Compounds earnings and charges performance fee
     *@param callFeeRecipient Caller address
     */
    function _harvest(address callFeeRecipient) internal whenNotPaused {
        IMultiRewardPool(rewardPool).getReward();
        uint256 outputBal = IERC20(output).balanceOf(address(this));
        uint256 secondOutputBal = IERC20(secondOutput).balanceOf(address(this));
        if (outputBal > 0 || secondOutputBal > 0) {
            chargeFees(callFeeRecipient);
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
        uint256 toOutput = IERC20(secondOutput).balanceOf(address(this));
        if (toOutput > 0) {
            IUniswapRouterETH(unirouter).swapExactTokensForTokens(
                toOutput,
                0,
                secondOutputToOutputRoute,
                address(this),
                block.timestamp
            );
        }

        uint256 toNative = IERC20(output).balanceOf(address(this)).mul(45).div(
            1000
        );
        IUniswapRouterETH(unirouter).swapExactTokensForTokens(
            toNative,
            0,
            outputToNativeRoute,
            address(this),
            block.timestamp
        );

        uint256 nativeBal = IERC20(native).balanceOf(address(this));

        uint256 callFeeAmount = nativeBal.mul(callFee).div(MAX_FEE);
        IERC20(native).safeTransfer(callFeeRecipient, callFeeAmount);

        uint256 beefyFeeAmount = nativeBal.mul(beefyFee).div(MAX_FEE);
        IERC20(native).safeTransfer(beefyFeeRecipient, beefyFeeAmount);

        uint256 strategistFee = nativeBal.mul(STRATEGIST_FEE).div(MAX_FEE);
        IERC20(native).safeTransfer(strategist, strategistFee);
    }

    /**
     *@notice Adds liquidity to AMM and gets more LP tokens.
     */
    function addLiquidity() internal {
        uint256 outputHalf = IERC20(output).balanceOf(address(this)).div(2);

        if (lpToken0 != output) {
            IUniswapRouterETH(unirouter).swapExactTokensForTokens(
                outputHalf,
                0,
                outputToLp0Route,
                address(this),
                block.timestamp
            );
        }

        if (lpToken1 != output) {
            IUniswapRouterETH(unirouter).swapExactTokensForTokens(
                outputHalf,
                0,
                outputToLp1Route,
                address(this),
                block.timestamp
            );
        }

        uint256 lp0Bal = IERC20(lpToken0).balanceOf(address(this));
        uint256 lp1Bal = IERC20(lpToken1).balanceOf(address(this));
        IUniswapRouterETH(unirouter).addLiquidity(
            lpToken0,
            lpToken1,
            lp0Bal,
            lp1Bal,
            1,
            1,
            address(this),
            block.timestamp
        );
    }

    /**
     *@notice Calculate the total underlaying 'want' held by the strat.
     *@return uint256 balance
     */
    function balanceOf() public view returns (uint256) {
        return balanceOfWant().add(balanceOfPool());
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
        return IMultiRewardPool(rewardPool).balanceOf(address(this));
    }

    /**
     *@notice Rreturns rewards unharvested
     *@return uint256 Amount rewards unharvested
     *@return uint256 Amount rewards unharvested
     */
    function rewardsAvailable() public view returns (uint256, uint256) {
        uint256[] memory rewards = IMultiRewardPool(rewardPool).earned(
            address(this)
        );
        return (rewards[0], rewards[1]);
    }

    /**
     *@notice Native reward amount for calling harvest
     *@return uint256 Native reward amount
     */
    function callReward() public view returns (uint256) {
        (uint256 outputBal, uint256 secondOutputBal) = rewardsAvailable();
        uint256 nativeOut;
        uint256[] memory amountOutFromSecond = IUniswapRouterETH(unirouter)
            .getAmountsOut(secondOutputBal, secondOutputToOutputRoute);
        outputBal += amountOutFromSecond[amountOutFromSecond.length - 1];
        uint256[] memory amountOut = IUniswapRouterETH(unirouter).getAmountsOut(
            outputBal,
            outputToNativeRoute
        );
        nativeOut = amountOut[amountOut.length - 1];

        return nativeOut.mul(45).div(1000).mul(callFee).div(MAX_FEE);
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

        IMultiRewardPool(rewardPool).withdraw(balanceOfPool());

        uint256 wantBal = balanceOfWant();
        IERC20(want).transfer(vault, wantBal);
    }

    /**
     *@notice Pauses deposits and withdraws all funds from third party systems.
     */
    function panic() public onlyManager {
        pause();
        IMultiRewardPool(rewardPool).withdraw(balanceOfPool());
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
     *@notice Get Output to Lp0
     *@return address Output to lp0 address
     */
    function outputToLp0() public view returns (address[] memory) {
        return outputToLp0Route;
    }

    /**
     *@notice Get Output to Lp1
     *@return address Output to lp1 address
     */
    function outputToLp1() public view returns (address[] memory) {
        return outputToLp1Route;
    }

    /**
     *@notice Get Output to native
     *@return address Output to native address
     */
    function outputToNative() public view returns (address[] memory) {
        return outputToNativeRoute;
    }

    /**
     *@notice Get Output to output
     *@return address Output to output address
     */
    function secondOutputToOutput() public view returns (address[] memory) {
        return secondOutputToOutputRoute;
    }

    /**
     *@notice Give all allowances
     */
    function _giveAllowances() internal {
        IERC20(want).safeApprove(rewardPool, type(uint256).max);
        IERC20(output).safeApprove(unirouter, type(uint256).max);
        IERC20(secondOutput).safeApprove(unirouter, type(uint256).max);

        IERC20(lpToken0).safeApprove(unirouter, 0);
        IERC20(lpToken0).safeApprove(unirouter, type(uint256).max);

        IERC20(lpToken1).safeApprove(unirouter, 0);
        IERC20(lpToken1).safeApprove(unirouter, type(uint256).max);
    }

    /**
     *@notice Remove all allowances
     */
    function _removeAllowances() internal {
        IERC20(want).safeApprove(rewardPool, 0);
        IERC20(output).safeApprove(unirouter, 0);
        IERC20(secondOutput).safeApprove(unirouter, 0);
        IERC20(lpToken0).safeApprove(unirouter, 0);
        IERC20(lpToken1).safeApprove(unirouter, 0);
    }
}
