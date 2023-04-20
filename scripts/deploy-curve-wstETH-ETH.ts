import { ethers } from "hardhat";

import vaultV7 from "../artifacts/contracts/vaults/YieldGeniusVault.sol/YieldGeniusVault.json";
import { verifyContract } from "../utils/verifyContract";

const hardhat = require("hardhat");

const CURVE = "0x11cDb42B0EB46D95f990BeDD4695A6e3fA034978"
const CVX = "0xb952A807345991BD529FDded05009F5e80Fe8F45"
const ETH = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"
const feeRecipient = "0x129C5292fCC814Ca48EE753823aB22131eAf5689"
const LIDO = "0x13Ad51ed4F1B7e9Dc168d8a00cB3f4dDD85EfA60"
const strategyParams = {
    want: "0xdbcd16e622c95acb2650b38ec799f76bfc557a0b",
    gaugeFactory: "0xabc000d88f23bb45525e447528dbf656a9d55bf5",
    gauge: "0x098ef55011b6b8c99845128114a9d9159777d697",
    pool: "0x6eb2dc694eb516b16dc9fbc678c60052bbdd7d80",
    params: ["2", "0", 0, 0], //[poolSize, depositIndex, useUnderlying, useMetapool]
    unirouter: "0xe592427a0aece92de3edee1f18e0157c05861564",
    paths: [ethers.utils.solidityPack(["address", "uint24", "address",], [CURVE, 3000, ETH]),
    ethers.utils.solidityPack(["address", "uint24", "address"], [ETH, 3000, ETH]),],
    crvToNativePath: ethers.utils.solidityPack(["address", "uint24", "address"], [LIDO, 10000, ETH]),
};
const vaultParams = {
    vaultName: "Test CurvewstETH-ETH",
    vaultSymbol: "Test-CurvewstETH-ETH",
    delay: 21600,
};

// Deploy function
async function deploy() {
    // const FeeConfigurator = await ethers.getContractFactory("FeeConfigurator")
    const [account] = await ethers.getSigners();
    const deployerAddress = account.address;
    const feeConfigurator = "0x85B1fcA863952068CeEcc40Fcb0A468e13d36c08"// pre deploy and config 1. setFeeCategory (reserach values0) 2. set strategyfeeid 
    const Vault = await ethers.getContractFactory("YieldGeniusVault")
    const vault = await Vault.attach("0x9746761149161381f11Ad163E7895B9d4AdeAc92");
    const StrategyCurveLPUniV3Router = await ethers.getContractFactory("StrategyCurveLPUniV3Router")


    await vault.deployed();
    console.log("Vault deployed to:", vault.address);
    const strategyConstructorArguments = [
        strategyParams.want,
        strategyParams.gaugeFactory,
        strategyParams.gauge,
        strategyParams.pool,
        strategyParams.params,
        strategyParams.paths,
        [vault.address,
        strategyParams.unirouter,
            deployerAddress,
            deployerAddress,
            feeRecipient,
            feeConfigurator],
    ];

    console.log("Params configured");

    const strategyCurveLPUniV3Router = await StrategyCurveLPUniV3Router.deploy(...strategyConstructorArguments);

    await strategyCurveLPUniV3Router.deployed();
    await strategyCurveLPUniV3Router.addRewardToken(strategyParams.crvToNativePath, "10000000000")

    console.log("Startegy deployed to:", strategyCurveLPUniV3Router.address);
    //Strategy verify
    await hardhat.run("verify:verify", {
        address: strategyCurveLPUniV3Router.address,
        constructorArguments: [...strategyConstructorArguments],
    })
    /*
        const vaultConstructorArguments = [
            strategyCurveLPUniV3Router.address,
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
            address: strategyCurveLPUniV3Router.address,
            constructorArguments: [...strategyConstructorArguments],
        })*/

}
deploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
