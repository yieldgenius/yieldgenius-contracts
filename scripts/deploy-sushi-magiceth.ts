import { ethers } from "hardhat";

import vaultV7 from "../artifacts/contracts/vaults/YieldGeniusVault.sol/YieldGeniusVault.json";
import { verifyContract } from "../utils/verifyContract";
const hardhat = require("hardhat");

const ensId = ethers.utils.formatBytes32String("zyt.eth");
const strategyParams = {
    want: "0xb7e50106a5bd3cf21af210a755f9c8740890a8c9",
    poolId: 13,
    chef: "0xf4d73326c13a4fc5fd7a064217e12780e9bd62c3",
    unirouter: "0x1b02da8cb0d097eb8d57a175b88c7d8b47997506",
    outputToNativeRoute: ["0xd4d42F0b6DEF4CE0383636770eF773390d85c61A", "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"],
    rewardToOutputRoute: ["0x539bdE0d7Dbd336b79148AA742883198BBF60342", "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", "0xd4d42F0b6DEF4CE0383636770eF773390d85c61A"],
    outputToLp0Route: ["0xd4d42F0b6DEF4CE0383636770eF773390d85c61A", "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", "0x539bdE0d7Dbd336b79148AA742883198BBF60342"],
    outputToLp1Route: ["0xd4d42F0b6DEF4CE0383636770eF773390d85c61A", "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"],
};
const vaultParams = {
    vaultName: "TestMAGIC-ETH",
    vaultSymbol: "testMAGIC-ETH",
    delay: 21600,
};

// Deploy function
async function deploy() {
    // const FeeConfigurator = await ethers.getContractFactory("FeeConfigurator")
    const [account] = await ethers.getSigners();
    const deployerAddress = account.address;
    // const feeConfigurator = "0xE0a0e6B07bC0f28F832A69CaCB75E614318cEba5"// pre deploy and config 1. setFeeCategory (reserach values0) 2. set strategyfeeid 
    const Vault = await ethers.getContractFactory("YieldGeniusVault")
    const vault = await Vault.deploy();
    const StrategyArbSushiDualLP = await ethers.getContractFactory("StrategyArbSushiDualLP")


    await vault.deployed();
    console.log("Vault deployed to:", vault.address);

    const strategyConstructorArguments = [
        strategyParams.want,
        strategyParams.poolId,
        strategyParams.chef,
        vault.address,
        strategyParams.unirouter,
        deployerAddress,
        deployerAddress,
        strategyParams.outputToNativeRoute,
        strategyParams.rewardToOutputRoute,
        strategyParams.outputToLp0Route,
        strategyParams.outputToLp1Route
    ];

    const strategyMagicEthSushi = await StrategyArbSushiDualLP.deploy(...strategyConstructorArguments);

    await strategyMagicEthSushi.deployed();

    console.log("Startegy deployed to:", strategyMagicEthSushi.address);

    const vaultConstructorArguments = [
        strategyMagicEthSushi.address,
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
        address: strategyMagicEthSushi.address,
        constructorArguments: [...strategyConstructorArguments],
    })

}
deploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
