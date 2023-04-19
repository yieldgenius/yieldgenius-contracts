import vaultV7 from "../artifacts/contracts/vaults/YieldGeniusVault.sol/YieldGeniusVault.json";
import Strategy from "../artifacts/contracts/strategies/common/StrategyCommonSolidlyStakerLP.sol/StrategyCommonSolidlyStakerLP.json";
import { ethers } from "hardhat";

const hardhat = require("hardhat");

const WETH = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"
const SLIZ = "0x463913D3a3D3D291667D53B8325c598Eb88D3B0e"

const strategyParamsSolidLizardSLIZWETH = {
    want: "0x751F3B8ca139bC1F3482b193297485f14208826a",
    gauge: "0x549855586afc1283E90295088ba5Eb51E7236ae8",
    gaugeStaker: "0x408BAF59E27a83740FF426d0BC8c1319f30720c7",
    unirouter: "0xF26515D5482e2C2FD237149bF6A653dA4794b3D0",
    feeRecipient: "0x129C5292fCC814Ca48EE753823aB22131eAf5689",
    feeConfig: "0x85B1fcA863952068CeEcc40Fcb0A468e13d36c08",
    outputToNativeRoute: [SLIZ, WETH, 0],
    outputToLp0Route1: [SLIZ, SLIZ, 0],
    outputToLp1Route: [SLIZ, WETH, 0],
};


const vaultParamsSolidLizardSLIZWETH = {
    vaultName: "YG SolidLizard SLIZ-WETH",
    vaultSymbol: "ygSolidLizardSLIZWETH",
    delay: 21600,
};


async function deploy() {
    const [account] = await ethers.getSigners();
    const deployerAddress = account.address;

    //Deploy SolidLizardSLIZWETH vault
    const VaultSolidLizardSLIZWETH = await ethers.getContractFactory("YieldGeniusVault");
    const vaultSolidLizardSLIZWETH = await VaultSolidLizardSLIZWETH.deploy();
    const StrategyCommonSolidlyStakerLP = await ethers.getContractFactory("StrategyCommonSolidlyStakerLP");
    const strategyBalancerMultiRewardGaugeUniV3 = await StrategyCommonSolidlyStakerLP.deploy();

    await vaultSolidLizardSLIZWETH.deployed();
    await strategyBalancerMultiRewardGaugeUniV3.deployed();

    console.log("Vault Balancer SolidLizardSLIZWETH deployed to:", vaultSolidLizardSLIZWETH.address);
    console.log("Startegy StrategyCommonSolidlyStakerLP for vault SolidLizardSLIZWETH deployed to:", strategyBalancerMultiRewardGaugeUniV3.address);

    const strategyConstructorArgumentsBalancerMultiRewardGaugeUniV3 = [
        strategyParamsSolidLizardSLIZWETH.want,
        strategyParamsSolidLizardSLIZWETH.gauge,
        strategyParamsSolidLizardSLIZWETH.gaugeStaker,
        [vaultSolidLizardSLIZWETH.address,
        strategyParamsSolidLizardSLIZWETH.unirouter,
            deployerAddress,
            deployerAddress,
        strategyParamsSolidLizardSLIZWETH.feeRecipient,
        strategyParamsSolidLizardSLIZWETH.feeConfig
        ],
        [strategyParamsSolidLizardSLIZWETH.outputToNativeRoute],
        [strategyParamsSolidLizardSLIZWETH.outputToLp0Route1],
        [strategyParamsSolidLizardSLIZWETH.outputToLp1Route]
    ];

    const strategyContractSolidLizardSLIZWETH = await ethers.getContractAt(Strategy.abi, strategyBalancerMultiRewardGaugeUniV3.address);
    let stratInitTxSolidLizardSLIZWETH = await strategyContractSolidLizardSLIZWETH.initialize(...strategyConstructorArgumentsBalancerMultiRewardGaugeUniV3);
    stratInitTxSolidLizardSLIZWETH = await stratInitTxSolidLizardSLIZWETH.wait()
    stratInitTxSolidLizardSLIZWETH.status === 1
        ? console.log(`Strategy balancer MultiReward Gauge Uni V3 Intilization done with tx: ${stratInitTxSolidLizardSLIZWETH.transactionHash}`)
        : console.log(`Strategy balancer MultiReward Gauge Uni V3 Intilization failed with tx: ${stratInitTxSolidLizardSLIZWETH.transactionHash}`);


    const vaultConstructorArgumentsSolidLizardSLIZWETH = [
        strategyBalancerMultiRewardGaugeUniV3.address,
        vaultParamsSolidLizardSLIZWETH.vaultName,
        vaultParamsSolidLizardSLIZWETH.vaultSymbol,
        vaultParamsSolidLizardSLIZWETH.delay,
    ];

    const vaultContractSolidLizardSLIZWETH = await ethers.getContractAt(vaultV7.abi, vaultSolidLizardSLIZWETH.address);
    let vaultInitTxSolidLizardSLIZWETH = await vaultContractSolidLizardSLIZWETH.initialize(...vaultConstructorArgumentsSolidLizardSLIZWETH);
    vaultInitTxSolidLizardSLIZWETH = await vaultInitTxSolidLizardSLIZWETH.wait()
    vaultInitTxSolidLizardSLIZWETH.status === 1
        ? console.log(`Vault SolidLizardSLIZWETH Intilization done with tx: ${vaultInitTxSolidLizardSLIZWETH.transactionHash}`)
        : console.log(`Vault SolidLizardSLIZWETH Intilization failed with tx: ${vaultInitTxSolidLizardSLIZWETH.transactionHash}`);

    // Verifications:
    try {

        //Strategy SolidLizardSLIZWETH Vault verify
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