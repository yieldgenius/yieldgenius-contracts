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
  const oneinchRouter = "0xF26515D5482e2C2FD237149bF6A653dA4794b3D0"
  const weth = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"
  const YieldGeniusZapOneInch = await ethers.getContractFactory("YieldGeniusySolidlyZap")
  const zap = await YieldGeniusZapOneInch.deploy(oneinchRouter, weth);

  console.log(`Zap deployed to: ${zap.address}`)



}
deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
