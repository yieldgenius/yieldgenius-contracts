import { ethers } from "hardhat";

import Staker from "../artifacts/contracts/utils/RamsesStaker.sol/RamsesStaker.json";
import { verifyContract } from "../utils/verifyContract";
const hardhat = require("hardhat");


const ramVoter = "0xaaa2564deb34763e3d05162ed3f5c2658691f499";
const veDist = "0xaaa86b908a3b500a0de661301ea63966923a97b1";


// Deploy function
async function deploy() {
    // const FeeConfigurator = await ethers.getContractFactory("FeeConfigurator")
    const [account] = await ethers.getSigners();
    const deployerAddress = account.address;

    const RamsesStaker = await ethers.getContractFactory("RamsesStaker")
    const ramsesStaker = await RamsesStaker.deploy(ramVoter, veDist, deployerAddress, deployerAddress, deployerAddress);
    await ramsesStaker.deployed();
    console.log("RamsesStaker deployed to:", ramsesStaker.address);



    //Staker Verify
    await hardhat.run("verify:verify", {
        address: ramsesStaker.address,
        constructorArguments: [ramVoter, veDist, deployerAddress, deployerAddress, deployerAddress],
    })

}

deploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
