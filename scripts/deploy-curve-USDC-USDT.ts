import { ethers } from "hardhat";

import vaultV7 from "../artifacts/contracts/vaults/YieldGeniusVault.sol/YieldGeniusVault.json";
import { verifyContract } from "../utils/verifyContract";

const ensId = ethers.utils.formatBytes32String("zyt.eth");
const CURVE = "0x11cDb42B0EB46D95f990BeDD4695A6e3fA034978"
const CVX = "0xb952A807345991BD529FDded05009F5e80Fe8F45"
const ETH = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"
const strategyParams = {
    want: "0x7f90122bf0700f9e7e1f688fe926940e8839f353",
    pool: "0x7f90122bf0700f9e7e1f688fe926940e8839f353 ",
    zap: "0x0000000000000000000000000000000000000000",
    pid: 3,
    params: ["2", "2", 0, 0],
    unirouter: "0xe592427a0aece92de3edee1f18e0157c05861564",
    crvToNativePath: ethers.utils.solidityPack(["address", "uint24", "address"], [CURVE, 1000, ETH]),
    cvxToNativePath: ethers.utils.solidityPack(["address", "uint24", "address"], [CVX, 1000, ETH]),
    nativeToDepositPath: ["0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"],
    nativeToDepositRoute: [],
};
const vaultParams = {
    vaultName: "Test CurveUSDC-USDT",
    vaultSymbol: "Test-CurveUSDC-USDT",
    delay: 21600,
};

// Deploy function
async function deploy() {
    // const FeeConfigurator = await ethers.getContractFactory("FeeConfigurator")
    const [account] = await ethers.getSigners();
    const deployerAddress = account.address;
    const feeConfigurator = "0xE0a0e6B07bC0f28F832A69CaCB75E614318cEba5"// pre deploy and config 1. setFeeCategory (reserach values0) 2. set strategyfeeid 
    const Vault = await ethers.getContractFactory("YieldGeniusVault")
    const vault = await Vault.deploy();
    const StrategyConvexL2 = await ethers.getContractFactory("StrategyConvexL2")


    await vault.deployed();
    console.log("Vault deployed to:", vault.address);
    const strategyConstructorArguments = [
        strategyParams.want,
        strategyParams.pool,
        strategyParams.zap,
        strategyParams.pid,
        strategyParams.params,
        strategyParams.crvToNativePath,
        strategyParams.cvxToNativePath,
        strategyParams.nativeToDepositPath,
        strategyParams.nativeToDepositRoute,
        [vault.address,
        strategyParams.unirouter,
            deployerAddress,
            deployerAddress,
            deployerAddress,
            feeConfigurator],
    ];

    const strategyConvexL2 = await StrategyConvexL2.deploy(...strategyConstructorArguments);

    await strategyConvexL2.deployed();

    console.log("Startegy deployed to:", strategyConvexL2.address);

    const vaultConstructorArguments = [
        strategyConvexL2.address,
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



    verifyContract(strategyConvexL2.address, strategyConstructorArguments)
    verifyContract(vault.address, [])

}
deploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
