import vaultV7 from "../artifacts/contracts/vaults/YieldGeniusVault.sol/YieldGeniusVault.json";
import BalancerMRUNIV3 from "../artifacts/contracts/vaults/StrategyBalancerMultiRewardGaugeUniV3.sol/StrategyBalancerMultiRewardGaugeUniV3.json";
import { ethers } from "hardhat";

const hardhat = require("hardhat");

const feeRecipient = "0x129C5292fCC814Ca48EE753823aB22131eAf5689"
const feeConfig = "0x85B1fcA863952068CeEcc40Fcb0A468e13d36c08"
const nativeToPoolId = "0x5028497af0c9a54ea8c6d42a054c0341b9fc6168000100000000000000000004"
const nativeToAssetInIndex = 0
const nativeToAssetOutIndex = 1
const OutputToPoolId = "0xcc65a812ce382ab909a11e434dbf75b34f1cc59d000200000000000000000001"
const OutputToPoolAssetInIndex = 0
const OutputToAssetOutIndex = 1

const strategyParamsBalancerwstETHETH = {
    want: "0x36bf227d6BaC96e2aB1EbB5492ECec69C691943f",
    switches: [0, 0],
    nativeToInputRoute: ethers.utils.solidityPack(["bytes32", "uint256", "uint256"], [nativeToPoolId, nativeToAssetInIndex, nativeToAssetOutIndex]),
    outputToNativeRoute: ethers.utils.solidityPack(["bytes32", "uint256", "uint256"], [OutputToPoolId, OutputToPoolAssetInIndex, OutputToAssetOutIndex]),
    assets1: ["0x040d1EdC9569d4Bab2D15287Dc5A4F10F56a56B8", "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"],
    assets2: ["0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"],
    rewardsGauge: "0x251e51b25AFa40F2B6b9F05aaf1bC7eAa0551771",
    unirouter: "	0xBA12222222228d8Ba445958a75a0704d566BF2C8",
};


const vaultParamsBalancerwstETHETH = {
    vaultName: "YG Balancer wstETH-ETH V2",
    vaultSymbol: "ygBalancerwstETH-ETHV2",
    delay: 21600,
};


async function deploy() {
    const [account] = await ethers.getSigners();
    const deployerAddress = account.address;

    //Deploy Balancer wstETH-ETH V2 vault
    const VaultBalancerwstETHETH = await ethers.getContractFactory("YieldGeniusVault");
    const vaultBalancerwstETHETH = await VaultBalancerwstETHETH.deploy();
    const StrategyBalancerMultiRewardGaugeUniV3 = await ethers.getContractFactory("StrategyBalancerMultiRewardGaugeUniV3");
    const strategyBalancerMultiRewardGaugeUniV3 = await StrategyBalancerMultiRewardGaugeUniV3.deploy();

    await vaultBalancerwstETHETH.deployed();
    await strategyBalancerMultiRewardGaugeUniV3.deployed();

    console.log("Vault Balancer Balancer wstETH-ETH V2 deployed to:", vaultBalancerwstETHETH.address);
    console.log("Startegy StrategyBalancerMultiRewardGaugeUniV3 for vault Balancer wstETH-ETH V2 deployed to:", strategyBalancerMultiRewardGaugeUniV3.address);

    const strategyConstructorArgumentsBalancerMultiRewardGaugeUniV3 = [
        strategyParamsBalancerwstETHETH.want,
        strategyParamsBalancerwstETHETH.switches,
        [strategyParamsBalancerwstETHETH.nativeToInputRoute],
        [strategyParamsBalancerwstETHETH.outputToNativeRoute],
        [strategyParamsBalancerwstETHETH.assets1, strategyParamsBalancerwstETHETH.assets2],
        strategyParamsBalancerwstETHETH.rewardsGauge,
        [vaultBalancerwstETHETH.address,
        strategyParamsBalancerwstETHETH.unirouter,
            deployerAddress,
            deployerAddress,
            feeRecipient,
            feeConfig]
    ];

    const strategyContractBalancerwstETHETH = await ethers.getContractAt(BalancerMRUNIV3.abi, strategyBalancerMultiRewardGaugeUniV3.address);
    let stratInitTxBalancerwstETHETH = await strategyContractBalancerwstETHETH.initialize(...strategyConstructorArgumentsBalancerMultiRewardGaugeUniV3);
    stratInitTxBalancerwstETHETH = await strategyBalancerMultiRewardGaugeUniV3.wait()
    stratInitTxBalancerwstETHETH.status === 1
        ? console.log(`Strategy balancer MultiReward Gauge Uni V3 Intilization done with tx: ${stratInitTxBalancerwstETHETH.transactionHash}`)
        : console.log(`Strategy balancer MultiReward Gauge Uni V3 Intilization failed with tx: ${stratInitTxBalancerwstETHETH.transactionHash}`);


    const vaultConstructorArgumentsBalancerwstETHETH = [
        strategyBalancerMultiRewardGaugeUniV3.address,
        vaultParamsBalancerwstETHETH.vaultName,
        vaultParamsBalancerwstETHETH.vaultSymbol,
        vaultParamsBalancerwstETHETH.delay,
    ];

    const vaultContractBalancerwstETHETH = await ethers.getContractAt(vaultV7.abi, vaultBalancerwstETHETH.address);
    let vaultInitTxBalancerwstETHETH = await vaultContractBalancerwstETHETH.initialize(...vaultConstructorArgumentsBalancerwstETHETH);
    vaultInitTxBalancerwstETHETH = await vaultInitTxBalancerwstETHETH.wait()
    vaultInitTxBalancerwstETHETH.status === 1
        ? console.log(`Vault Balancer wstETH-ETH V2 Intilization done with tx: ${vaultInitTxBalancerwstETHETH.transactionHash}`)
        : console.log(`Vault Balancer wstETH-ETH V2 Intilization failed with tx: ${vaultInitTxBalancerwstETHETH.transactionHash}`);




    // Verifications:
    try {

        //Strategy Balancer wstETH-ETH V2 Vault verify
        await hardhat.run("verify:verify", {
            address: strategyBalancerMultiRewardGaugeUniV3.address,
            constructorArguments: [...strategyConstructorArgumentsBalancerMultiRewardGaugeUniV3],
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