import vaultV7 from "../artifacts/contracts/vaults/YieldGeniusVault.sol/YieldGeniusVault.json";
import Strategy from "../artifacts/contracts/strategies/common/StrategyCommonSolidlyStakerLP.sol/StrategyCommonSolidlyStakerLP.json";
import { ethers } from "hardhat";

const hardhat = require("hardhat");

const RAM = "0xAAA6C1E32C55A7Bfa8066A6FAE9b42650F262418"
const WETH = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"
const USDC = "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"
const MAI = "0x3F56e0c36d275367b8C502090EDF38289b3dEa0d"


const strategyParamsRamsesMAIUSDC = {
    want: "0x3c6eF5Ed8ad5DF0d5e3D05C6e607c60F987fB735",
    gauge: "0x046074d8Bb942B160a598937BD9BB84FB74330B7",
    gaugeStaker: "0x46dcAFBb2C9d479827F69BeC9314E13741f21058",
    unirouter: "0xAAA87963EFeB6f7E0a2711F397663105Acb1805e",
    feeRecipient: "0x129C5292fCC814Ca48EE753823aB22131eAf5689",
    feeConfig: "0x85B1fcA863952068CeEcc40Fcb0A468e13d36c08",
    outputToNativeRoute:  [RAM, WETH, 0],
    outputToLp0Route1:  [RAM, USDC, 0],
    outputToLp0Route2: [USDC, MAI, 1],
    outputToLp1Route: [RAM, USDC, 0],
};


const vaultParamsRamsesMAIUSDC = {
    vaultName: "YG Ramses MAI-USDC",
    vaultSymbol: "ygRamsesMAI-USDC",
    delay: 21600,
};


async function deploy() {
    const [account] = await ethers.getSigners();
    const deployerAddress = account.address;

    //Deploy RamsesMAIUSDC vault
    const VaultRamsesMAIUSDC = await ethers.getContractFactory("YieldGeniusVault");
    const vaultRamsesMAIUSDC = await VaultRamsesMAIUSDC.deploy();
    const StrategyCommonSolidlyStakerLP = await ethers.getContractFactory("StrategyCommonSolidlyStakerLP");
    const strategyBalancerMultiRewardGaugeUniV3 = await StrategyCommonSolidlyStakerLP.deploy();

    await vaultRamsesMAIUSDC.deployed();
    await strategyBalancerMultiRewardGaugeUniV3.deployed();

    console.log("Vault Balancer RamsesMAIUSDC deployed to:", vaultRamsesMAIUSDC.address);
    console.log("Startegy StrategyCommonSolidlyStakerLP for vault RamsesMAIUSDC deployed to:", strategyBalancerMultiRewardGaugeUniV3.address);

    const strategyConstructorArgumentsBalancerMultiRewardGaugeUniV3 = [
        strategyParamsRamsesMAIUSDC.want,
        strategyParamsRamsesMAIUSDC.gauge,
        strategyParamsRamsesMAIUSDC.gaugeStaker,
        [vaultRamsesMAIUSDC.address,
        strategyParamsRamsesMAIUSDC.unirouter,
            deployerAddress,
            deployerAddress,
        strategyParamsRamsesMAIUSDC.feeRecipient,
        strategyParamsRamsesMAIUSDC.feeConfig
        ],
        [strategyParamsRamsesMAIUSDC.outputToNativeRoute],
        [strategyParamsRamsesMAIUSDC.outputToLp0Route1, strategyParamsRamsesMAIUSDC.outputToLp0Route2],
        [strategyParamsRamsesMAIUSDC.outputToLp1Route]
    ];

    const strategyContractRamsesMAIUSDC = await ethers.getContractAt(Strategy.abi, strategyBalancerMultiRewardGaugeUniV3.address);
    let stratInitTxRamsesMAIUSDC = await strategyContractRamsesMAIUSDC.initialize(...strategyConstructorArgumentsBalancerMultiRewardGaugeUniV3);
    stratInitTxRamsesMAIUSDC = await stratInitTxRamsesMAIUSDC.wait()
    stratInitTxRamsesMAIUSDC.status === 1
        ? console.log(`Strategy balancer MultiReward Gauge Uni V3 Intilization done with tx: ${stratInitTxRamsesMAIUSDC.transactionHash}`)
        : console.log(`Strategy balancer MultiReward Gauge Uni V3 Intilization failed with tx: ${stratInitTxRamsesMAIUSDC.transactionHash}`);


    const vaultConstructorArgumentsRamsesMAIUSDC = [
        strategyBalancerMultiRewardGaugeUniV3.address,
        vaultParamsRamsesMAIUSDC.vaultName,
        vaultParamsRamsesMAIUSDC.vaultSymbol,
        vaultParamsRamsesMAIUSDC.delay,
    ];

    const vaultContractRamsesMAIUSDC = await ethers.getContractAt(vaultV7.abi, vaultRamsesMAIUSDC.address);
    let vaultInitTxRamsesMAIUSDC = await vaultContractRamsesMAIUSDC.initialize(...vaultConstructorArgumentsRamsesMAIUSDC);
    vaultInitTxRamsesMAIUSDC = await vaultInitTxRamsesMAIUSDC.wait()
    vaultInitTxRamsesMAIUSDC.status === 1
        ? console.log(`Vault RamsesMAIUSDC Intilization done with tx: ${vaultInitTxRamsesMAIUSDC.transactionHash}`)
        : console.log(`Vault RamsesMAIUSDC Intilization failed with tx: ${vaultInitTxRamsesMAIUSDC.transactionHash}`);

    // Verifications:
    try {

        //Strategy RamsesMAIUSDC Vault verify
        await hardhat.run("verify:verify", {
            address: strategyBalancerMultiRewardGaugeUniV3.address,
            constructorArguments: [],
        });

    } catch (error) {

    }

};

deploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });