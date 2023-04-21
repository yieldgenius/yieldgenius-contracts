import { ethers } from "hardhat";
import vaultV7 from "../artifacts/contracts/vaults/YieldGeniusVault.sol/YieldGeniusVault.json";
const hardhat = require("hardhat");

const strategyParams = {
    want: "0x8b8149Dd385955DC1cE77a4bE7700CCD6a212e65",
    poolId: 3,
    chef: "0x9BA666165867E916Ee7Ed3a3aE6C19415C2fBDDD",
    unirouter: "0x16e71B13fE6079B4312063F7E81F76d165Ad32Ad",
    outputToNativeRoute: ["0x3B475F6f2f41853706afc9Fa6a6b8C5dF1a2724c", "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"],
    outputToLp0Route: ["0x3B475F6f2f41853706afc9Fa6a6b8C5dF1a2724c", "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8"],
    outputToLp1Route: ["0x3B475F6f2f41853706afc9Fa6a6b8C5dF1a2724c", "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"],
};
const vaultParams = {
    vaultName: "YG WETH-USDC",
    vaultSymbol: "ygWETH-USDC",
    delay: 21600,
};

// Deploy function
async function deploy() {
    const FeeConfigurator = await ethers.getContractFactory("FeeConfigurator")
    const [account] = await ethers.getSigners();
    const deployerAddress = account.address;
    const feeRecipient = "0x129C5292fCC814Ca48EE753823aB22131eAf5689"
    const feeConfig = "0x85B1fcA863952068CeEcc40Fcb0A468e13d36c08"
    const Vault = await ethers.getContractFactory("YieldGeniusVault")
    const vault = await Vault.deploy();
    const StrategyZyberMultiRewardsLP = await ethers.getContractFactory("StrategyZyberMultiRewardsLP")


    await vault.deployed();
    console.log("Vault deployed to:", vault.address);

    const strategyConstructorArguments = [
        strategyParams.want,
        strategyParams.poolId,
        strategyParams.chef,
        [vault.address,
        strategyParams.unirouter,
            deployerAddress,
            deployerAddress,
            feeRecipient,
            feeConfig],
        strategyParams.outputToNativeRoute,
        strategyParams.outputToLp0Route,
        strategyParams.outputToLp1Route
    ];

    const strategyCommonChefLP = await StrategyZyberMultiRewardsLP.deploy(...strategyConstructorArguments);

    await strategyCommonChefLP.deployed();

    console.log("Startegy deployed to:", strategyCommonChefLP.address);

    const vaultConstructorArguments = [
        strategyCommonChefLP.address,
        vaultParams.vaultName,
        vaultParams.vaultSymbol,
        vaultParams.delay,
    ];

    const vaultContract = await ethers.getContractAt(vaultV7.abi, vault.address);
    let vaultInitTx = await vaultContract.initialize(...vaultConstructorArguments);
    vaultInitTx = await vaultInitTx.wait()
    vaultInitTx.status === 1
        ? console.log(`Vault Intilization done with tx: ${vaultInitTx.transactionHash}`)
        : console.log(`Vault Intilization failed with tx: ${vaultInitTx.transactionHash}`);


    //Strategy verify
    await hardhat.run("verify:verify", {
        address: strategyCommonChefLP.address,
        constructorArguments: [...strategyConstructorArguments],
    });

}
deploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
