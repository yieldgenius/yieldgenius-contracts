import { ethers } from "hardhat";
import vaultV7 from "../artifacts/contracts/vaults/YieldGeniusVault.sol/YieldGeniusVault.json";
const hardhat = require("hardhat");

const strategyParams = {
    want: "0x9a0b05f3cf748a114a4f8351802b3bffe07100d4",
    poolId: 3,
    chef: "0x2b0a43dccbd7d42c18f6a83f86d1a19fa58d541a",  
    unirouter: "0x327df1e6de05895d2ab08513aadd9313fe505d86", 
    outputToNativeRoute: ["0x78a087d713Be963Bf307b18F2Ff8122EF9A63ae9", "0x4200000000000000000000000000000000000006"],
    outputToLp0Route: ["0x78a087d713Be963Bf307b18F2Ff8122EF9A63ae9", "0x4200000000000000000000000000000000000006"],
    outputToLp1Route: ["0x78a087d713Be963Bf307b18F2Ff8122EF9A63ae9", "0x4200000000000000000000000000000000000006", "0xEB466342C4d449BC9f53A865D5Cb90586f405215"],
};
const vaultParams = {
    vaultName: "YG axlUSDC-ETH",
    vaultSymbol: "ygaxlUSDC-ETH",
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
    const StrategyBaseChefLP = await ethers.getContractFactory("StrategyBaseChefLP")


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
        strategyParams.outputToLp0Route,
        strategyParams.outputToLp1Route
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
    //      address: vault.address,
    //      constructorArguments: [],
    //  });
    //Strategy verify
    await hardhat.run("verify:verify", {
        address: strategyBaseChefLP.address,
        constructorArguments: [...strategyConstructorArguments],
        contract: "contracts/strategies/base/StrategyBaseChefLP.sol:StrategyBaseChefLP"
    });

}
deploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
