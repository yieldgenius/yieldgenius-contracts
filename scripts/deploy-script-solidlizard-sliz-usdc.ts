import vaultV7 from "../artifacts/contracts/vaults/YieldGeniusVault.sol/YieldGeniusVault.json";
import Strategy from "../artifacts/contracts/strategies/common/StrategyCommonSolidlyStakerLP.sol/StrategyCommonSolidlyStakerLP.json";
import { ethers } from "hardhat";

const hardhat = require("hardhat");

const WETH = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"
const SLIZ = "0x463913D3a3D3D291667D53B8325c598Eb88D3B0e"
const USDC = "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"

const strategyParamsSolidLizardSLIZUSDC = {
    want: "0x9E7fB82fdF08a6aAba760A81F0A64602Af045d2a",
    gauge: "0x07C26dEcaA281779ed50fC3481CF1d52D5aa088a",
    gaugeStaker: "0x95473790e9dbD6a2268C2045a3F72AD34c7B9957",
    unirouter: "0xF26515D5482e2C2FD237149bF6A653dA4794b3D0",
    feeRecipient: "0x129C5292fCC814Ca48EE753823aB22131eAf5689",
    feeConfig: "0x85B1fcA863952068CeEcc40Fcb0A468e13d36c08",
    outputToNativeRoute: [SLIZ, WETH, 0],
    outputToLp0Route1: [SLIZ, SLIZ, 0],
    outputToLp1Route: [SLIZ, USDC, 0],
};


const vaultParamsSolidLizardSLIZUSDC = {
    vaultName: "YG SolidLizard SLIZ-USDC",
    vaultSymbol: "ygSolidLizardSLIZ-USDC",
    delay: 21600,
};


async function deploy() {
    const [account] = await ethers.getSigners();
    const deployerAddress = account.address;

    //Deploy SolidLizardSLIZUSDC vault
    const VaultSolidLizardSLIZUSDC = await ethers.getContractFactory("YieldGeniusVault");
    const vaultSolidLizardSLIZUSDC = await VaultSolidLizardSLIZUSDC.deploy();
    const StrategyCommonSolidlyStakerLP = await ethers.getContractFactory("StrategyCommonSolidlyStakerLP");
    const strategyBalancerMultiRewardGaugeUniV3 = await StrategyCommonSolidlyStakerLP.deploy();

    await vaultSolidLizardSLIZUSDC.deployed();
    await strategyBalancerMultiRewardGaugeUniV3.deployed();

    console.log("Vault Balancer SolidLizardSLIZUSDC deployed to:", vaultSolidLizardSLIZUSDC.address);
    console.log("Startegy StrategyCommonSolidlyStakerLP for vault SolidLizardSLIZUSDC deployed to:", strategyBalancerMultiRewardGaugeUniV3.address);

    const strategyConstructorArgumentsBalancerMultiRewardGaugeUniV3 = [
        strategyParamsSolidLizardSLIZUSDC.want,
        strategyParamsSolidLizardSLIZUSDC.gauge,
        strategyParamsSolidLizardSLIZUSDC.gaugeStaker,
        [vaultSolidLizardSLIZUSDC.address,
        strategyParamsSolidLizardSLIZUSDC.unirouter,
            deployerAddress,
            deployerAddress,
        strategyParamsSolidLizardSLIZUSDC.feeRecipient,
        strategyParamsSolidLizardSLIZUSDC.feeConfig
        ],
        [strategyParamsSolidLizardSLIZUSDC.outputToNativeRoute],
        [strategyParamsSolidLizardSLIZUSDC.outputToLp0Route1],
        [strategyParamsSolidLizardSLIZUSDC.outputToLp1Route]
    ];

    const strategyContractSolidLizardSLIZUSDC = await ethers.getContractAt(Strategy.abi, strategyBalancerMultiRewardGaugeUniV3.address);
    let stratInitTxSolidLizardSLIZUSDC = await strategyContractSolidLizardSLIZUSDC.initialize(...strategyConstructorArgumentsBalancerMultiRewardGaugeUniV3);
    stratInitTxSolidLizardSLIZUSDC = await stratInitTxSolidLizardSLIZUSDC.wait()
    stratInitTxSolidLizardSLIZUSDC.status === 1
        ? console.log(`Strategy balancer MultiReward Gauge Uni V3 Intilization done with tx: ${stratInitTxSolidLizardSLIZUSDC.transactionHash}`)
        : console.log(`Strategy balancer MultiReward Gauge Uni V3 Intilization failed with tx: ${stratInitTxSolidLizardSLIZUSDC.transactionHash}`);


    const vaultConstructorArgumentsSolidLizardSLIZUSDC = [
        strategyBalancerMultiRewardGaugeUniV3.address,
        vaultParamsSolidLizardSLIZUSDC.vaultName,
        vaultParamsSolidLizardSLIZUSDC.vaultSymbol,
        vaultParamsSolidLizardSLIZUSDC.delay,
    ];

    const vaultContractSolidLizardSLIZUSDC = await ethers.getContractAt(vaultV7.abi, vaultSolidLizardSLIZUSDC.address);
    let vaultInitTxSolidLizardSLIZUSDC = await vaultContractSolidLizardSLIZUSDC.initialize(...vaultConstructorArgumentsSolidLizardSLIZUSDC);
    vaultInitTxSolidLizardSLIZUSDC = await vaultInitTxSolidLizardSLIZUSDC.wait()
    vaultInitTxSolidLizardSLIZUSDC.status === 1
        ? console.log(`Vault SolidLizardSLIZUSDC Intilization done with tx: ${vaultInitTxSolidLizardSLIZUSDC.transactionHash}`)
        : console.log(`Vault SolidLizardSLIZUSDC Intilization failed with tx: ${vaultInitTxSolidLizardSLIZUSDC.transactionHash}`);

    // Verifications:
    try {

        //Strategy SolidLizardSLIZUSDC Vault verify
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