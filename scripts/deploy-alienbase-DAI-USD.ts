import { ethers } from "hardhat";
import vaultV7 from "../artifacts/contracts/vaults/YieldGeniusVault.sol/YieldGeniusVault.json";
const hardhat = require("hardhat");

const strategyParams = {
    want: "0xd97a40434627D5c897790DE9a3d2E577Cba5F2E0",
    poolId: 8,
    chef: "0x52eaeCAC2402633d98b95213d0b473E069D86590",  
    unirouter: "0x7f2ff89d3C45010c976Ea6bb7715DC7098AF786E", 
    outputToNativeRoute: ["0x1dd2d631c92b1aCdFCDd51A0F7145A50130050C4", "0x4200000000000000000000000000000000000006"],
    nativeToLp0Route: ["0x4200000000000000000000000000000000000006", "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA", "0xB79DD08EA68A908A97220C76d19A6aA9cBDE4376", "0x65a2508C429a6078a7BC2f7dF81aB575BD9D9275"],
    nativeToLp1Route: ["0x4200000000000000000000000000000000000006", "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA", "0xB79DD08EA68A908A97220C76d19A6aA9cBDE4376"],
};
const vaultParams = {
    vaultName: "YG Alien-DAI+-USD+",
    vaultSymbol: "yg-alien-DAI+-USD+",
    delay: 21600,
};

// Deploy function
async function deploy() {    
    const FeeConfigurator = await ethers.getContractFactory("FeeConfigurator")
    const [account] = await ethers.getSigners();
    const deployerAddress = account.address;
    const feeConfigurator = "0x5Ce2501c22c7E898BfE8ff8B1f4A0c18a3a70c16"// pre deploy and config 1. setFeeCategory (reserach values0) 2. set strategyfeeid 
     const Vault = await ethers.getContractFactory("YieldGeniusVault")
     const vault = await Vault.deploy();
    const StrategyBaseChefLP = await ethers.getContractFactory("StrategyStellaswapMultiRewardsLP")


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
            "0x129C5292fCC814Ca48EE753823aB22131eAf5689",
            feeConfigurator],
        strategyParams.outputToNativeRoute,
        strategyParams.nativeToLp0Route,
        strategyParams.nativeToLp1Route
    ];
 
     const strategyBaseChefLP = await StrategyBaseChefLP.deploy(...strategyConstructorArguments);

     await strategyBaseChefLP.deployed();

     console.log("Startegy deployed to:", strategyBaseChefLP.address);

     const vaultConstructorArguments = [
         strategyBaseChefLP.address,
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
    //  await hardhat.run("verify:verify", {
    //      address: "0xFB6efaA6C9685D67256Db0F7409DB2A5D275A829",
    //      constructorArguments: [],
    //  });
    //Strategy verify
    await hardhat.run("verify:verify", {
        address: strategyBaseChefLP.address,
        constructorArguments: [...strategyConstructorArguments],
        contract: "contracts/strategies/alienbase/StrategyStellaswapMultiRewardsLP.sol:StrategyStellaswapMultiRewardsLP"
    });

}
deploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
