import { ethers } from "hardhat";


const vaultParams = {
  vaultName: "MultiRewardZYB-WETH",
  vaultSymbol: "multiRewardZYB-WETH",
  delay: 21600,
};

// Deploy function
async function deploy() {
  const [account] = await ethers.getSigners();

  const deployer = account.address;

  const YieldGeniusDistributor = await ethers.getContractFactory("YieldGeniusDistributor")
  const TestToken = await ethers.getContractFactory("TestToken")
  const EscrowMaster = await ethers.getContractFactory("EscrowMaster")

  const testToken = await TestToken.deploy()
  await testToken.deployed()
  console.log(`TestToken deployed to: ${testToken.address}`)


  const escrowMaster = await EscrowMaster.deploy(testToken.address)
  await escrowMaster.deployed()
  console.log(`EscrowMaster deployed to: ${escrowMaster.address}`)
  const perSec = ethers.utils.parseEther("0.1")

  const yieldGeniusDistributor = await YieldGeniusDistributor.deploy(testToken.address, perSec, deployer, "10", deployer, escrowMaster.address)
  await yieldGeniusDistributor.deployed()
  console.log(`YieldGeniusDistributor deployed to: ${yieldGeniusDistributor.address}`)

  const zybEthVault = "0x5ECeBEbCff6CE4c57A2694106c556d67B217DEf7"
  await yieldGeniusDistributor.add("100", zybEthVault, "0", "0", [])
  await yieldGeniusDistributor.startFarming()


}
deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
