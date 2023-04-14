import { ethers } from "hardhat";


import { verifyContract } from "../utils/verifyContract";

const hardhat = require("hardhat");



// Deploy function
async function deploy() {
    // const FeeConfigurator = await ethers.getContractFactory("FeeConfigurator")
    const [account] = await ethers.getSigners();
    const deployerAddress = account.address;
    const feeWallet = "0x129C5292fCC814Ca48EE753823aB22131eAf5689"// 
    const YieldGeniusBoost = await ethers.getContractFactory("YieldGeniusBoost")

    const vaultToken = "0xE5FC7B5d0B1FE7BAF4BF7b4BA649f06Af2436047" // zyb-eth vault
    const usdc = "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8"
    const duration = 30 * 86400 // 30 days in seconds
    const boostParams = [
        vaultToken,
        usdc,
        duration,
        deployerAddress,
        feeWallet,
    ]
    const boost = await YieldGeniusBoost.deploy(...boostParams);

    await boost.deployed();
    console.log("YieldGeniusBoost deployed to:", boost.address);



    //Boost verify
    await hardhat.run("verify:verify", {
        address: boost.address,
        constructorArguments: [...boostParams],
    })

}
deploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
