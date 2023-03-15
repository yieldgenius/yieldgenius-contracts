import { ethers } from "hardhat";
import vaultV7 from "../artifacts/contracts/vaults/YieldGeniusVault.sol/YieldGeniusVault.json";
const hardhat = require("hardhat");

const strategyParams = {
    want: "0x3eC0eddCd1e25025077327886A78133589082fB2",
    poolId: 1,
    chef: "0x9BA666165867E916Ee7Ed3a3aE6C19415C2fBDDD",
    unirouter: "0x16e71B13fE6079B4312063F7E81F76d165Ad32Ad",
    outputToNativeRoute: ["0x3B475F6f2f41853706afc9Fa6a6b8C5dF1a2724c", "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8"],
    outputToLp0Route: ["0x3B475F6f2f41853706afc9Fa6a6b8C5dF1a2724c", "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8"],
    outputToLp1Route: ["0x3B475F6f2f41853706afc9Fa6a6b8C5dF1a2724c"],
};
const vaultParams = {
    vaultName: "TestZYB-USDC",
    vaultSymbol: "testZYB-USDC",
    delay: 21600,
};

// Deploy function
async function deploy() {
    const FeeConfigurator = await ethers.getContractFactory("FeeConfigurator")
    const [account] = await ethers.getSigners();
    const deployerAddress = account.address;
    const feeConfigurator = "0xE0a0e6B07bC0f28F832A69CaCB75E614318cEba5"// pre deploy and config 1. setFeeCategory (reserach values0) 2. set strategyfeeid 
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
            deployerAddress,
            feeConfigurator],
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

    //Vault verify
    await hardhat.run("verify:verify", {
        address: vault.address,
        constructorArguments: [],
    })
    //Strategy verify
    await hardhat.run("verify:verify", {
        address: strategyCommonChefLP.address,
        constructorArguments: [...strategyConstructorArguments],
    })

}

deploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
