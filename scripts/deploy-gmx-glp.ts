import { ethers } from "hardhat";

import vaultV7 from "../artifacts/contracts/vaults/YieldGeniusVault.sol/YieldGeniusVault.json";
import { verifyContract } from "../utils/verifyContract";
const hardhat = require("hardhat");

const strategyParams = {
    want: "0x5402B5F40310bDED796c7D0F3FF6683f5C0cFfdf",
    native: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    minter: "0xB95DB5B167D75e6d04227CfFFA61069348d271F5",
    chef: "0xA906F338CB21815cBc4Bc87ace9e68c87eF8d8F1",
    outputToNativeRoute: ["0xd4d42F0b6DEF4CE0383636770eF773390d85c61A", "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"],
    rewardToOutputRoute: ["0x539bdE0d7Dbd336b79148AA742883198BBF60342", "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", "0xd4d42F0b6DEF4CE0383636770eF773390d85c61A"],
    outputToLp0Route: ["0xd4d42F0b6DEF4CE0383636770eF773390d85c61A", "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", "0x539bdE0d7Dbd336b79148AA742883198BBF60342"],
    outputToLp1Route: ["0xd4d42F0b6DEF4CE0383636770eF773390d85c61A", "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"],
    uniRouter: "0x0000000000000000000000000000000000000000"
};
const vaultParams = {
    vaultName: "TestGMX-GLP",
    vaultSymbol: "testGMX-GLP",
    delay: 21600,
};

// Deploy function
async function deploy() {
    // const FeeConfigurator = await ethers.getContractFactory("FeeConfigurator")
    const [account] = await ethers.getSigners();
    const deployerAddress = account.address;
    const feeConfigurator = "0xE0a0e6B07bC0f28F832A69CaCB75E614318cEba5"// pre deploy and config 1. setFeeCategory (reserach values0) 2. set strategyfeeid 
    const Vault = await ethers.getContractFactory("YieldGeniusVault")
    const vault = await Vault.deploy();
    const StrategyGLP = await ethers.getContractFactory("StrategyGLP")


    await vault.deployed();
    console.log("Vault deployed to:", vault.address);

    const strategyConstructorArguments = [
        strategyParams.want,
        strategyParams.native,
        strategyParams.minter,
        strategyParams.chef,
        [vault.address,
        strategyParams.uniRouter,
            deployerAddress,
            deployerAddress,
            deployerAddress,
            feeConfigurator],
    ];

    const strategyGlp = await StrategyGLP.deploy(...strategyConstructorArguments);

    await strategyGlp.deployed();

    console.log("Startegy deployed to:", strategyGlp.address);

    const vaultConstructorArguments = [
        strategyGlp.address,
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
        address: strategyGlp.address,
        constructorArguments: [...strategyConstructorArguments],
    })

}
deploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
