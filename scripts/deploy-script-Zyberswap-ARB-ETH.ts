import vaultV7 from "../artifacts/contracts/vaults/YieldGeniusVault.sol/YieldGeniusVault.json";
import { ethers } from "hardhat";

const hardhat = require("hardhat");

const feeRecipient = "0x129C5292fCC814Ca48EE753823aB22131eAf5689"
const feeConfig = "0x85B1fcA863952068CeEcc40Fcb0A468e13d36c08"


const strategyParamsChefLpARBETH = {
    want: "0x7dB09b248F026F1a77D58B56Ab92943666672968",
    poolId: 17,
    chef: "0x9BA666165867E916Ee7Ed3a3aE6C19415C2fBDDD",
    unirouter: "0x16e71B13fE6079B4312063F7E81F76d165Ad32Ad",
    outputToNativeRoute: ["0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", "0x912ce59144191c1204e64559fe8253a0e49e6548"],
    outputToLp0Route: ["0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", "0x912ce59144191c1204e64559fe8253a0e49e6548"],
    outputToLp1Route: ["0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"],
};


const vaultParamsChefLpARBETH = {
    vaultName: "YG ARB-ETH",
    vaultSymbol: "ygARB-ETH",
    delay: 21600,
};


async function deploy() {
    const [account] = await ethers.getSigners();
    const deployerAddress = account.address;

    //Deploy Chef LP ARB-ETH vault
    const VaultChefLpARBETH = await ethers.getContractFactory("YieldGeniusVault")
    const vaultChefLpARBETH = await VaultChefLpARBETH.deploy();
    const StrategyZyberMultiRewardsLPChefLpARBETH = await ethers.getContractFactory("StrategyZyberMultiRewardsLP")

    await vaultChefLpARBETH.deployed();
    console.log("Vault Chef LP ARB-ETH deployed to:", vaultChefLpARBETH.address);

    const strategyConstructorArgumentsChefLpARBETH = [
        strategyParamsChefLpARBETH.want,
        strategyParamsChefLpARBETH.poolId,
        strategyParamsChefLpARBETH.chef,
        [vaultChefLpARBETH.address,
            strategyParamsChefLpARBETH.unirouter,
            deployerAddress,
            deployerAddress,
            feeRecipient,
            feeConfig],
        strategyParamsChefLpARBETH.outputToNativeRoute,
        strategyParamsChefLpARBETH.outputToLp0Route,
        strategyParamsChefLpARBETH.outputToLp1Route
    ];

    const strategyCommonChefLPChefLpARBETH = await StrategyZyberMultiRewardsLPChefLpARBETH.deploy(...strategyConstructorArgumentsChefLpARBETH);

    await strategyCommonChefLPChefLpARBETH.deployed();

    console.log("Startegy StrategyZyberMultiRewardsLP for vault Chef LP ARB-ETH deployed to:", strategyCommonChefLPChefLpARBETH.address);

    const vaultConstructorArgumentsChefLpWETHUSDC = [
        strategyCommonChefLPChefLpARBETH.address,
        vaultParamsChefLpARBETH.vaultName,
        vaultParamsChefLpARBETH.vaultSymbol,
        vaultParamsChefLpARBETH.delay,
    ];

    const vaultContractChefLpARBETH = await ethers.getContractAt(vaultV7.abi, vaultChefLpARBETH.address);
    let vaultInitTxChefLpARBETH = await vaultContractChefLpARBETH.initialize(...vaultConstructorArgumentsChefLpWETHUSDC);
    vaultInitTxChefLpARBETH = await vaultInitTxChefLpARBETH.wait()
    vaultInitTxChefLpARBETH.status === 1
        ? console.log(`Vault Chef LP ARB-ETH Intilization done with tx: ${vaultInitTxChefLpARBETH.transactionHash}`)
        : console.log(`Vault Chef LP ARB-ETH Intilization failed with tx: ${vaultInitTxChefLpARBETH.transactionHash}`);

    // Verifications:
    try {

        //Strategy LP ARB-ETH verify
        await hardhat.run("verify:verify", {
            address: strategyCommonChefLPChefLpARBETH.address,
            constructorArguments: [...strategyConstructorArgumentsChefLpARBETH],
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