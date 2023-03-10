import { ethers } from "hardhat";

import vaultV7 from "../artifacts/contracts/vaults/YieldGeniusVault.sol/YieldGeniusVault.json";

const vaultParams = {
  vaultName: "MultiRewardZYB-WETH",
  vaultSymbol: "multiRewardZYB-WETH",
  delay: 21600,
};

// Deploy function
async function deploy() {
  const [account] = await ethers.getSigners();
  const deployerAddress = account.address;
  const oneinchRouter = "0x1111111254EEB25477B68fb85Ed929f73A960582"
  const weth = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"
  const YieldGeniusZapOneInch = await ethers.getContractFactory("YieldGeniusZapOneInch")
  const zap = await YieldGeniusZapOneInch.deploy(oneinchRouter, weth);

  console.log(`Zap deployed to: ${zap.address}`)



}
deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
