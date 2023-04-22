import { ethers } from "hardhat";

import Staker from "../artifacts/contracts/strategies/beSolid/DystopiaStaker.sol/DystopiaStaker.json";
import { verifyContract } from "../utils/verifyContract";
const hardhat = require("hardhat");


const dystVoter = "0x98a1de08715800801e9764349f5a71cbe63f99cc";
const veDist = "0x29d3622c78615a1e7459e4be434d816b7de293e4";


// Deploy function
async function deploy() {
    // const FeeConfigurator = await ethers.getContractFactory("FeeConfigurator")
    const [account] = await ethers.getSigners();
    const deployerAddress = account.address;

    const DystopiaStaker = await ethers.getContractFactory("DystopiaStaker")
    const dystopiaStaker = await DystopiaStaker.deploy(dystVoter, veDist, deployerAddress, deployerAddress, deployerAddress);
    await dystopiaStaker.deployed();
    console.log("DystopiaStaker deployed to:", dystopiaStaker.address);



    //Staker Verify
    await hardhat.run("verify:verify", {
        address: dystopiaStaker.address,
        constructorArguments: [dystVoter, veDist, deployerAddress, deployerAddress, deployerAddress],
    })

}

deploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
