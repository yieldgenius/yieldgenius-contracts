import { ethers } from "hardhat";
const hardhat = require("hardhat");

// Deploy function
async function deploy() {
  const [account] = await ethers.getSigners();
 
  const GasPrice = await ethers.getContractFactory("GasPrice")
  const gasPrice = await GasPrice.deploy();

  console.log(`gasPrice deployed to: ${gasPrice.address}`)

  await hardhat.run("verify:verify", {
    address: gasPrice.address,
    constructorArguments: [],
})

}
deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
