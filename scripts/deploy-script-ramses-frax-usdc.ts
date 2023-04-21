import vaultV7 from "../artifacts/contracts/vaults/YieldGeniusVault.sol/YieldGeniusVault.json";
import Strategy from "../artifacts/contracts/strategies/common/StrategyCommonSolidlyStakerLP.sol/StrategyCommonSolidlyStakerLP.json";
import { ethers } from "hardhat";

const hardhat = require("hardhat");

const RAM = "0xAAA6C1E32C55A7Bfa8066A6FAE9b42650F262418"
const WETH = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"
const USDC = "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"
const FRAX = "0x17FC002b466eEc40DaE837Fc4bE5c67993ddBd6F"


const strategyParamsRamsesFRAXUSDC = {
    want: "0xfE3b6dD9457e13b2F44B9356E55Fc5e6248B27Ba",
    gauge: "0x22B6C54dC1cCD6CDF53723BEc88327c908258367",
    gaugeStaker: "0xf992Baa5c7B011Bb95AA2ea42b27385C5B71D9d4",
    unirouter: "0xAAA87963EFeB6f7E0a2711F397663105Acb1805e",
    feeRecipient: "0x129C5292fCC814Ca48EE753823aB22131eAf5689",
    feeConfig: "0x85B1fcA863952068CeEcc40Fcb0A468e13d36c08",
    outputToNativeRoute: [RAM, WETH, 0],
    outputToLp0Route1: [RAM, USDC, 0],
    outputToLp0Route2: [USDC, FRAX, 1],
    outputToLp1Route: [RAM, USDC, 0],
};


const vaultParamsRamsesFRAXUSDC = {
    vaultName: "YG Ramses FRAX-USDC",
    vaultSymbol: "ygRamsesFRAX-USDC",
    delay: 21600,
};


async function deploy() {
    const [account] = await ethers.getSigners();
    const deployerAddress = account.address;

    //Deploy RamsesFRAXUSDC vault
    const VaultRamsesFRAXUSDC = await ethers.getContractFactory("YieldGeniusVault");
    const vaultRamsesFRAXUSDC = await VaultRamsesFRAXUSDC.deploy();
    const StrategyCommonSolidlyStakerLP = await ethers.getContractFactory("StrategyCommonSolidlyStakerLP");
    const strategyBalancerMultiRewardGaugeUniV3 = await StrategyCommonSolidlyStakerLP.deploy();

    await vaultRamsesFRAXUSDC.deployed();
    await strategyBalancerMultiRewardGaugeUniV3.deployed();

    console.log("Vault Balancer RamsesFRAXUSDC deployed to:", vaultRamsesFRAXUSDC.address);
    console.log("Startegy StrategyCommonSolidlyStakerLP for vault RamsesFRAXUSDC deployed to:", strategyBalancerMultiRewardGaugeUniV3.address);

    const strategyConstructorArgumentsBalancerMultiRewardGaugeUniV3 = [
        strategyParamsRamsesFRAXUSDC.want,
        strategyParamsRamsesFRAXUSDC.gauge,
        strategyParamsRamsesFRAXUSDC.gaugeStaker,
        [vaultRamsesFRAXUSDC.address,
        strategyParamsRamsesFRAXUSDC.unirouter,
            deployerAddress,
            deployerAddress,
        strategyParamsRamsesFRAXUSDC.feeRecipient,
        strategyParamsRamsesFRAXUSDC.feeConfig
        ],
        [strategyParamsRamsesFRAXUSDC.outputToNativeRoute],
        [strategyParamsRamsesFRAXUSDC.outputToLp0Route1, strategyParamsRamsesFRAXUSDC.outputToLp0Route2],
        [strategyParamsRamsesFRAXUSDC.outputToLp1Route]
    ];

    const strategyContractRamsesFRAXUSDC = await ethers.getContractAt(Strategy.abi, strategyBalancerMultiRewardGaugeUniV3.address);
    let stratInitTxRamsesFRAXUSDC = await strategyContractRamsesFRAXUSDC.initialize(...strategyConstructorArgumentsBalancerMultiRewardGaugeUniV3);
    stratInitTxRamsesFRAXUSDC = await stratInitTxRamsesFRAXUSDC.wait()
    stratInitTxRamsesFRAXUSDC.status === 1
        ? console.log(`Strategy balancer MultiReward Gauge Uni V3 Intilization done with tx: ${stratInitTxRamsesFRAXUSDC.transactionHash}`)
        : console.log(`Strategy balancer MultiReward Gauge Uni V3 Intilization failed with tx: ${stratInitTxRamsesFRAXUSDC.transactionHash}`);


    const vaultConstructorArgumentsRamsesFRAXUSDC = [
        strategyBalancerMultiRewardGaugeUniV3.address,
        vaultParamsRamsesFRAXUSDC.vaultName,
        vaultParamsRamsesFRAXUSDC.vaultSymbol,
        vaultParamsRamsesFRAXUSDC.delay,
    ];

    const vaultContractRamsesFRAXUSDC = await ethers.getContractAt(vaultV7.abi, vaultRamsesFRAXUSDC.address);
    let vaultInitTxRamsesFRAXUSDC = await vaultContractRamsesFRAXUSDC.initialize(...vaultConstructorArgumentsRamsesFRAXUSDC);
    vaultInitTxRamsesFRAXUSDC = await vaultInitTxRamsesFRAXUSDC.wait()
    vaultInitTxRamsesFRAXUSDC.status === 1
        ? console.log(`Vault RamsesFRAXUSDC Intilization done with tx: ${vaultInitTxRamsesFRAXUSDC.transactionHash}`)
        : console.log(`Vault RamsesFRAXUSDC Intilization failed with tx: ${vaultInitTxRamsesFRAXUSDC.transactionHash}`);

    // Verifications:
    try {

        //Strategy RamsesFRAXUSDC Vault verify
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