import vaultV7 from "../artifacts/contracts/vaults/YieldGeniusVault.sol/YieldGeniusVault.json";
import { ethers } from "hardhat";

const hardhat = require("hardhat");

const feeRecipient = "0x129C5292fCC814Ca48EE753823aB22131eAf5689"


const strategyParamsBalancerMultiRewardGauge = {
    balancerPoolIds: ["0x64541216bafffeec8ea535bb71fbc927831d0595000100000000000000000002"],
    rewardsGauge: "0x104f1459a2fFEa528121759B238BB609034C2f01",
    input: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
    unirouter: "0xba12222222228d8ba445958a75a0704d566bf2c8",
};


const vaultParamsBalancerwstETHETH = {
    vaultName: "YG Balancer WBTC-WETH-USDC",
    vaultSymbol: "ygBalancerWBTC-WETH-USDC",
    delay: 21600,
};


async function deploy() {
    const [account] = await ethers.getSigners();
    const deployerAddress = account.address;

    //Deploy Curve TriCrypto vault
    const VaultBalancerWBTCWETHUSDC = await ethers.getContractFactory("YieldGeniusVault");
    const vaultBalancerWBTCWETHUSDC = await VaultBalancerWBTCWETHUSDC.deploy();
    const StrategyBalancerMultiRewardGauge = await ethers.getContractFactory("StrategyBalancerMultiRewardGauge");

    await vaultBalancerWBTCWETHUSDC.deployed();


    console.log("Vault Curve Abrcdbr MIM-2CRV  deployed to:", vaultBalancerWBTCWETHUSDC.address);


    const strategyConstructorArgumentsBalancerMultiRewardGauge = [
        strategyParamsBalancerMultiRewardGauge.balancerPoolIds,
        strategyParamsBalancerMultiRewardGauge.input,
        vaultBalancerWBTCWETHUSDC.address,
        strategyParamsBalancerMultiRewardGauge.unirouter,
        deployerAddress,
        deployerAddress,
        feeRecipient,
    ];
    const strategyBalancerMultiRewardGauge = await StrategyBalancerMultiRewardGauge.deploy(...strategyConstructorArgumentsBalancerMultiRewardGauge);
    await strategyBalancerMultiRewardGauge.deployed();
    console.log("Startegy StrategyBalancerMultiRewardGauge for vault Balancer WBTC-WETH-USDC deployed to:", strategyBalancerMultiRewardGauge.address);

    const vaultConstructorArgumentBalancerWBTCWETHUSDC = [
        strategyBalancerMultiRewardGauge.address,
        vaultParamsBalancerwstETHETH.vaultName,
        vaultParamsBalancerwstETHETH.vaultSymbol,
        vaultParamsBalancerwstETHETH.delay,
    ];

    const vaultContractBalancerWBTCWETHUSDC = await ethers.getContractAt(vaultV7.abi, vaultBalancerWBTCWETHUSDC.address);
    let vaultInitTxBalancerWBTCWETHUSDC = await vaultContractBalancerWBTCWETHUSDC.initialize(...vaultConstructorArgumentBalancerWBTCWETHUSDC);
    vaultInitTxBalancerWBTCWETHUSDC = await vaultInitTxBalancerWBTCWETHUSDC.wait()
    vaultInitTxBalancerWBTCWETHUSDC.status === 1
        ? console.log(`Vault Balancer WBTC-WETH-USDC Intilization done with tx: ${vaultInitTxBalancerWBTCWETHUSDC.transactionHash}`)
        : console.log(`Vault Balancer WBTC-WETH-USDC Intilization failed with tx: ${vaultInitTxBalancerWBTCWETHUSDC.transactionHash}`);


    // Verifications:
    try {

        //Strategy Balancer WBTC-WETH-USDCVault verify
        await hardhat.run("verify:verify", {
            address: strategyBalancerMultiRewardGauge.address,
            constructorArguments: [...strategyConstructorArgumentsBalancerMultiRewardGauge],
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