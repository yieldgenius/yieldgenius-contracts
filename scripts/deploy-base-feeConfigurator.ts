import { ethers } from "hardhat";

import feeConfiguratorParth from "../artifacts/contracts/utils/FeeConfigurator.sol/FeeConfigurator.json";
const hardhat = require("hardhat");


// Deploy function
async function deploy() {
    const [account] = await ethers.getSigners();
    const deployerAddress = account.address;

    //Deploy FeeConfigurator

    const FeeConfigurator = await ethers.getContractFactory("FeeConfigurator");
    const feeConfigurator = await FeeConfigurator.deploy();
    await feeConfigurator.deployed();
    console.log("FeeConfigurator is deploy to address:", feeConfigurator.address);

    const feeConfiguratorContract = await ethers.getContractAt(feeConfiguratorParth.abi, feeConfigurator.address);
    let feeConfiguratorInit = await feeConfiguratorContract.initialize(deployerAddress, "50000000000000000");
    feeConfiguratorInit = await feeConfiguratorInit.wait()
    feeConfiguratorInit.status === 1
        ? console.log(`Fee Configurator initialized with tx: ${feeConfiguratorInit.transactionHash}`)
        : console.log(`Fee Configurator intilization failed with tx: ${feeConfiguratorInit.transactionHash}`);

    let feeConfiguratorSetFeeCat = await feeConfiguratorContract.setFeeCategory("0", "50000000000000000", "0", "0", "default", 1, 1);
    feeConfiguratorSetFeeCat = await feeConfiguratorSetFeeCat.wait()
    feeConfiguratorSetFeeCat.status === 1
        ? console.log(`Fee category is set with tx: ${feeConfiguratorSetFeeCat.transactionHash}`)
        : console.log(`Fee category setting failed with tx ${feeConfiguratorSetFeeCat.transactionHash}`);


    //Verify FeeConfigurator 
    await hardhat.run("verify:verify", {
        address: feeConfigurator.address,
        constructorArguments: [],
    })
}
deploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
