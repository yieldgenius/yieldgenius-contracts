import vaultV7 from "../artifacts/contracts/vaults/YieldGeniusVault.sol/YieldGeniusVault.json";
import Strategy from "../artifacts/contracts/strategies/common/StrategyCommonSolidlyStakerLP.sol/StrategyCommonSolidlyStakerLP.json";
import { ethers } from "hardhat";

const hardhat = require("hardhat");

const RAM = "0xAAA6C1E32C55A7Bfa8066A6FAE9b42650F262418"
const WETH = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"
const USDC = "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"
const USDT = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"

const strategyParamsRamsesUSDTUSDC = {
    want: "0xe25c248Ee2D3D5B428F1388659964446b4d78599",
    gauge: "0x3AC64d4Af6734aEf5b95A3f99e2A04F3D2461938",
    gaugeStaker: "0xf992Baa5c7B011Bb95AA2ea42b27385C5B71D9d4",
    unirouter: "0xAAA87963EFeB6f7E0a2711F397663105Acb1805e",
    feeRecipient: "0x129C5292fCC814Ca48EE753823aB22131eAf5689",
    feeConfig: "0x85B1fcA863952068CeEcc40Fcb0A468e13d36c08",
    outputToNativeRoute:  [RAM, WETH, 0],
    outputToLp0Route1:  [RAM, USDC, 0],
    outputToLp0Route2: [USDC, USDT, 1],
    outputToLp1Route: [RAM, USDC, 0],
};


const vaultParamsRamsesUSDTUSDC = {
    vaultName: "YG Ramses USDT-USDC",
    vaultSymbol: "ygRamsesUSDT-USDC",
    delay: 21600,
};


async function deploy() {
    const [account] = await ethers.getSigners();
    const deployerAddress = account.address;

    //Deploy RamsesUSDTUSDC vault
    const VaultRamsesUSDTUSDC = await ethers.getContractFactory("YieldGeniusVault");
    const vaultRamsesUSDTUSDC = await VaultRamsesUSDTUSDC.deploy();
    const StrategyCommonSolidlyStakerLP = await ethers.getContractFactory("StrategyCommonSolidlyStakerLP");
    const strategyBalancerMultiRewardGaugeUniV3 = await StrategyCommonSolidlyStakerLP.deploy();

    await vaultRamsesUSDTUSDC.deployed();
    await strategyBalancerMultiRewardGaugeUniV3.deployed();

    console.log("Vault Balancer RamsesUSDTUSDC deployed to:", vaultRamsesUSDTUSDC.address);
    console.log("Startegy StrategyCommonSolidlyStakerLP for vault RamsesUSDTUSDC deployed to:", strategyBalancerMultiRewardGaugeUniV3.address);

    const strategyConstructorArgumentsBalancerMultiRewardGaugeUniV3 = [
        strategyParamsRamsesUSDTUSDC.want,
        strategyParamsRamsesUSDTUSDC.gauge,
        strategyParamsRamsesUSDTUSDC.gaugeStaker,
        [vaultRamsesUSDTUSDC.address,
        strategyParamsRamsesUSDTUSDC.unirouter,
            deployerAddress,
            deployerAddress,
        strategyParamsRamsesUSDTUSDC.feeRecipient,
        strategyParamsRamsesUSDTUSDC.feeConfig
        ],
        [strategyParamsRamsesUSDTUSDC.outputToNativeRoute],
        [strategyParamsRamsesUSDTUSDC.outputToLp0Route1, strategyParamsRamsesUSDTUSDC.outputToLp0Route2],
        [strategyParamsRamsesUSDTUSDC.outputToLp1Route]
    ];

    const strategyContractRamsesUSDTUSDC = await ethers.getContractAt(Strategy.abi, strategyBalancerMultiRewardGaugeUniV3.address);
    let stratInitTxRamsesUSDTUSDC = await strategyContractRamsesUSDTUSDC.initialize(...strategyConstructorArgumentsBalancerMultiRewardGaugeUniV3);
    
    stratInitTxRamsesUSDTUSDC.status === 1
        ? console.log(`Strategy balancer MultiReward Gauge Uni V3 Intilization done with tx: ${stratInitTxRamsesUSDTUSDC.transactionHash}`)
        : console.log(`Strategy balancer MultiReward Gauge Uni V3 Intilization failed with tx: ${stratInitTxRamsesUSDTUSDC.transactionHash}`);


    const vaultConstructorArgumentsRamsesUSDTUSDC = [
        strategyBalancerMultiRewardGaugeUniV3.address,
        vaultParamsRamsesUSDTUSDC.vaultName,
        vaultParamsRamsesUSDTUSDC.vaultSymbol,
        vaultParamsRamsesUSDTUSDC.delay,
    ];

    const vaultContractRamsesUSDTUSDC = await ethers.getContractAt(vaultV7.abi, vaultRamsesUSDTUSDC.address);
    let vaultInitTxRamsesUSDTUSDC = await vaultContractRamsesUSDTUSDC.initialize(...vaultConstructorArgumentsRamsesUSDTUSDC);
    vaultInitTxRamsesUSDTUSDC = await vaultInitTxRamsesUSDTUSDC.wait()
    vaultInitTxRamsesUSDTUSDC.status === 1
        ? console.log(`Vault RamsesUSDTUSDC Intilization done with tx: ${vaultInitTxRamsesUSDTUSDC.transactionHash}`)
        : console.log(`Vault RamsesUSDTUSDC Intilization failed with tx: ${vaultInitTxRamsesUSDTUSDC.transactionHash}`);

    // Verifications:
    try {

        //Strategy RamsesUSDTUSDC Vault verify
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