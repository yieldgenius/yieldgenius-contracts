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
  const Vault = await ethers.getContractFactory("YieldGeniusVault")
  const vault = await Vault.deploy();

  const StrategyCommonMultiRewardPoolLP = await ethers.getContractFactory("StrategyCommonMultiRewardPoolLP")


  await vault.deployed();
  console.log("Vault deployed to:", vault.address);


  const want = "0xf69223B75D9CF7c454Bb44e30a3772202bEE72CF" // lp token of the farm pool ZYB-ETH in our case
  const rewardPool = "0x0000000000000000000000000000000000000000" //multi reward pool address is needed
  const vaultA = vault.address
  const uniRouter = "0x16e71B13fE6079B4312063F7E81F76d165Ad32Ad" // zyberwap router
  const keeper = deployerAddress
  const strategist = deployerAddress
  const beefyFeeRecipient = deployerAddress
  const outputToNativeRoute = ["0x3B475F6f2f41853706afc9Fa6a6b8C5dF1a2724c", "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"] // from zyb to weth
  const outputToLp0Route = ["0x3B475F6f2f41853706afc9Fa6a6b8C5dF1a2724c", "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"]
  const outputToLp1Route = ["0x3B475F6f2f41853706afc9Fa6a6b8C5dF1a2724c", "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"]
  const secondOutputToOutputRoute = ["0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", "0x3B475F6f2f41853706afc9Fa6a6b8C5dF1a2724c"] // WETH to ZYB
  const strategyCommonMultiRewardPoolLP = await StrategyCommonMultiRewardPoolLP.deploy(
    want,
    rewardPool,
    vaultA,
    uniRouter,
    keeper,
    strategist,
    beefyFeeRecipient,
    outputToNativeRoute,
    secondOutputToOutputRoute,
    outputToLp0Route,
    outputToLp1Route
  )
  console.log("Startegy deployed to:", strategyCommonMultiRewardPoolLP.address);

  const vaultConstructorArguments = [
    strategyCommonMultiRewardPoolLP.address,
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



}
deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
