import { ethers } from "hardhat";


// Deploy function
async function deploy() {
  const [account] = await ethers.getSigners();
  const deployerAddress = account.address;
  const oneinchRouter = "0x1111111254EEB25477B68fb85Ed929f73A960582"
  const weth = "GasPrice"
  const GasPrice = await ethers.getContractFactory("GasPrice")
  const gasPrice = await GasPrice.deploy();

  console.log(`gasPrice deployed to: ${gasPrice.address}`)



}
deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
