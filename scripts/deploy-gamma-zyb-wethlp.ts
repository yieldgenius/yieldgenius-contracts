import { ethers } from "hardhat";
import vaultV7 from "../artifacts/contracts/vaults/YieldGeniusVault.sol/YieldGeniusVault.json";
import { advanceTimeAndBlock } from "../test/helpers/time";
const hardhat = require("hardhat");

const ensId = ethers.utils.formatBytes32String("zyt.eth");
const strategyParams = {
    want: "0x35ea99ab62bcf7992136558e94fb97c7807fcd6a",
    poolId: 8,
    chef: "0x9BA666165867E916Ee7Ed3a3aE6C19415C2fBDDD",
    unirouter: "0xFa58b8024B49836772180f2Df902f231ba712F72",
    outputToNativeRoute: ["0x3B475F6f2f41853706afc9Fa6a6b8C5dF1a2724c", "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"],
    outputToLp0Route: ["0x3B475F6f2f41853706afc9Fa6a6b8C5dF1a2724c", "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"],
    outputToLp1Route: ["0x3B475F6f2f41853706afc9Fa6a6b8C5dF1a2724c"],
};
const vaultParams = {
    vaultName: "TestZYB-WETH",
    vaultSymbol: "testZYB-WETH",
    delay: 10,
};

// Deploy function
async function deploy() {
    const FeeConfigurator = await ethers.getContractFactory("FeeConfigurator")
    const [account] = await ethers.getSigners();
    const deployerAddress = account.address;
    const feeConfigurator = "0x85B1fcA863952068CeEcc40Fcb0A468e13d36c08"// pre deploy and config 1. setFeeCategory (reserach values0) 2. set strategyfeeid 
    const Vault = await ethers.getContractFactory("YieldGeniusVault")
    const vault = await Vault.deploy();
    const StrategyZyberMultiRewardsLP = await ethers.getContractFactory("StrategyZyberMultiRewardsGamma")
    const uniProxy = "0x0a9c566eda6641a308b4641d9ff99d20ced50b24"

    await vault.deployed();
    console.log("Vault deployed to:", vault.address);

    const strategyConstructorArguments = [
        strategyParams.want,
        strategyParams.poolId,
        strategyParams.chef,
        [vault.address,
        strategyParams.unirouter,
            deployerAddress,
            deployerAddress,
            deployerAddress,
            feeConfigurator],
        strategyParams.outputToNativeRoute,
        strategyParams.outputToLp0Route,
        strategyParams.outputToLp1Route,
        uniProxy
    ];

    const strategyCommonChefLP = await StrategyZyberMultiRewardsLP.deploy(...strategyConstructorArguments);

    await strategyCommonChefLP.deployed();

    console.log("Startegy deployed to:", strategyCommonChefLP.address);

    const vaultConstructorArguments = [
        strategyCommonChefLP.address,
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

    //Vault verify
    /* await hardhat.run("verify:verify", {
         address: vault.address,
         constructorArguments: [],
     })
     //Strategy verify
     await hardhat.run("verify:verify", {
         address: strategyCommonChefLP.address,
         constructorArguments: [...strategyConstructorArguments],
     })*/

    const deployer = "0xCe92a79260Bf17eF5c2b11089f27d0A9A1be85a0"
    const impersonatedSigner = await ethers.getImpersonatedSigner(deployer);

    const TestToken = await ethers.getContractFactory("TestToken")
    const testToken = await TestToken.attach(strategyParams.want);
    await testToken.connect(impersonatedSigner).approve(vault.address, ethers.utils.parseEther("1000000"));
    await vault.connect(impersonatedSigner).depositAll()


    await advanceTimeAndBlock(60 * 60);
    await strategyCommonChefLP.connect(impersonatedSigner)["harvest()"]();

}
deploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
