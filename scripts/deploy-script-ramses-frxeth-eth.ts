import vaultV7 from "../artifacts/contracts/vaults/YieldGeniusVault.sol/YieldGeniusVault.json";
import Strategy from "../artifacts/contracts/strategies/common/StrategyCommonSolidlyStakerLP.sol/StrategyCommonSolidlyStakerLP.json";
import { ethers } from "hardhat";

const hardhat = require("hardhat");

const RAM = "0xAAA6C1E32C55A7Bfa8066A6FAE9b42650F262418"
const WETH = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"
const frxETH = "0x178412e79c25968a32e89b11f63B33F733770c2A"


const strategyParamsRamsesfrxETHETH = {
    want: "0x3932192dE4f17DFB94Be031a8458E215A44BF560",
    gauge: "0x148Ca200d452AD9F310501ca3fd5C3bD4a5aBe81",
    gaugeStaker: "0xf992Baa5c7B011Bb95AA2ea42b27385C5B71D9d4",
    unirouter: "0xAAA87963EFeB6f7E0a2711F397663105Acb1805e",
    feeRecipient: "0x129C5292fCC814Ca48EE753823aB22131eAf5689",
    feeConfig: "0x85B1fcA863952068CeEcc40Fcb0A468e13d36c08",
    outputToNativeRoute:  [RAM, WETH, 0],
    outputToLp0Route1:  [RAM, WETH, 0],
    outputToLp0Route2: [WETH, frxETH, 1],
    outputToLp1Route: [RAM, WETH, 0],
};


const vaultParamsRamsesfrxETHETH = {
    vaultName: "YG Ramses frxETH-ETH",
    vaultSymbol: "ygRamsesfrxETH-ETH",
    delay: 21600,
};


async function deploy() {
    const [account] = await ethers.getSigners();
    const deployerAddress = account.address;

    //Deploy RamsesfrxETHETH vault
    const VaultRamsesfrxETHETH = await ethers.getContractFactory("YieldGeniusVault");
    const vaultRamsesfrxETHETH = await VaultRamsesfrxETHETH.deploy();
    const StrategyCommonSolidlyStakerLP = await ethers.getContractFactory("StrategyCommonSolidlyStakerLP");
    const strategyBalancerMultiRewardGaugeUniV3 = await StrategyCommonSolidlyStakerLP.deploy();

    await vaultRamsesfrxETHETH.deployed();
    await strategyBalancerMultiRewardGaugeUniV3.deployed();

    console.log("Vault Balancer RamsesfrxETHETH deployed to:", vaultRamsesfrxETHETH.address);
    console.log("Startegy StrategyCommonSolidlyStakerLP for vault RamsesfrxETHETH deployed to:", strategyBalancerMultiRewardGaugeUniV3.address);

    const strategyConstructorArgumentsBalancerMultiRewardGaugeUniV3 = [
        strategyParamsRamsesfrxETHETH.want,
        strategyParamsRamsesfrxETHETH.gauge,
        strategyParamsRamsesfrxETHETH.gaugeStaker,
        [vaultRamsesfrxETHETH.address,
        strategyParamsRamsesfrxETHETH.unirouter,
            deployerAddress,
            deployerAddress,
        strategyParamsRamsesfrxETHETH.feeRecipient,
        strategyParamsRamsesfrxETHETH.feeConfig
        ],
        [strategyParamsRamsesfrxETHETH.outputToNativeRoute],
        [strategyParamsRamsesfrxETHETH.outputToLp0Route1, strategyParamsRamsesfrxETHETH.outputToLp0Route2],
        [strategyParamsRamsesfrxETHETH.outputToLp1Route]
    ];

    const strategyContractRamsesfrxETHETH = await ethers.getContractAt(Strategy.abi, strategyBalancerMultiRewardGaugeUniV3.address);
    let stratInitTxRamsesfrxETHETH = await strategyContractRamsesfrxETHETH.initialize(...strategyConstructorArgumentsBalancerMultiRewardGaugeUniV3);
    stratInitTxRamsesfrxETHETH = await stratInitTxRamsesfrxETHETH.wait()
    stratInitTxRamsesfrxETHETH.status === 1
        ? console.log(`Strategy balancer MultiReward Gauge Uni V3 Intilization done with tx: ${stratInitTxRamsesfrxETHETH.transactionHash}`)
        : console.log(`Strategy balancer MultiReward Gauge Uni V3 Intilization failed with tx: ${stratInitTxRamsesfrxETHETH.transactionHash}`);


    const vaultConstructorArgumentsRamsesfrxETHETH = [
        strategyBalancerMultiRewardGaugeUniV3.address,
        vaultParamsRamsesfrxETHETH.vaultName,
        vaultParamsRamsesfrxETHETH.vaultSymbol,
        vaultParamsRamsesfrxETHETH.delay,
    ];

    const vaultContractRamsesfrxETHETH = await ethers.getContractAt(vaultV7.abi, vaultRamsesfrxETHETH.address);
    let vaultInitTxRamsesfrxETHETH = await vaultContractRamsesfrxETHETH.initialize(...vaultConstructorArgumentsRamsesfrxETHETH);
    vaultInitTxRamsesfrxETHETH = await vaultInitTxRamsesfrxETHETH.wait()
    vaultInitTxRamsesfrxETHETH.status === 1
        ? console.log(`Vault RamsesfrxETHETH Intilization done with tx: ${vaultInitTxRamsesfrxETHETH.transactionHash}`)
        : console.log(`Vault RamsesfrxETHETH Intilization failed with tx: ${vaultInitTxRamsesfrxETHETH.transactionHash}`);

    // Verifications:
    try {

        //Strategy RamsesfrxETHETH Vault verify
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