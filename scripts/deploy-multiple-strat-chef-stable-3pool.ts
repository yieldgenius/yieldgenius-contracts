import vaultV7 from "../artifacts/contracts/vaults/YieldGeniusVault.sol/YieldGeniusVault.json";
import { ethers } from "hardhat";

const hardhat = require("hardhat");

const feeRecipient = "0x129C5292fCC814Ca48EE753823aB22131eAf5689"
const feeConfig = "0x85B1fcA863952068CeEcc40Fcb0A468e13d36c08"


const strategyParamsChef3pool = {
    want: "0x1A90A043751A364447110FF95CCa05AE752d85BE",
    poolId: 7,
    chef: "0x9BA666165867E916Ee7Ed3a3aE6C19415C2fBDDD",
    unirouter: "0x16e71B13fE6079B4312063F7E81F76d165Ad32Ad",
    stablerouter: "0x969f7699fbB9C79d8B61315630CDeED95977Cfb8",
    outputToNativeRoute: ["0x3B475F6f2f41853706afc9Fa6a6b8C5dF1a2724c", "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"],
    outputToInputRoute: ["0x3B475F6f2f41853706afc9Fa6a6b8C5dF1a2724c", "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8"],
}

const vaultParamsChefLpARBETH = {
    vaultName: "YG ZYB-3pool",
    vaultSymbol: "ygZYB-3pool",
    delay: 21600,
};


async function deploy() {
    const [account] = await ethers.getSigners();
    const deployerAddress = account.address;

    //Deploy Chef LP ARB-ETH vault
    const VaultChefLpARBETH = await ethers.getContractFactory("YieldGeniusVault")
    const vaultChefLpARBETH = await VaultChefLpARBETH.deploy();
    const StrategyZyberStable = await ethers.getContractFactory("StrategyZyberStable")

    await vaultChefLpARBETH.deployed();
    console.log("Vault Chef LP ARB-ETH deployed to:", vaultChefLpARBETH.address);

    const strategyConstructorArgumentsChef3pool = [
        strategyParamsChef3pool.want,
        strategyParamsChef3pool.poolId,
        strategyParamsChef3pool.chef,
        strategyParamsChef3pool.stablerouter,
        [vaultChefLpARBETH.address,
        strategyParamsChef3pool.unirouter,
            deployerAddress,
            deployerAddress,
            feeRecipient,
            feeConfig],
        strategyParamsChef3pool.outputToNativeRoute,
        strategyParamsChef3pool.outputToInputRoute
    ];

    const strategyZyberStable = await StrategyZyberStable.deploy(...strategyConstructorArgumentsChef3pool);

    await strategyZyberStable.deployed();

    console.log("Startegy StrategyZyberStable for vault Chef 3POOL deployed to:", strategyZyberStable.address);

    const vaultConstructorArgumentsChefLpWETHUSDC = [
        strategyZyberStable.address,
        vaultParamsChefLpARBETH.vaultName,
        vaultParamsChefLpARBETH.vaultSymbol,
        vaultParamsChefLpARBETH.delay,
    ];

    const vaultContractChefLpARBETH = await ethers.getContractAt(vaultV7.abi, vaultChefLpARBETH.address);
    let vaultInitTxChefLpARBETH = await vaultContractChefLpARBETH.initialize(...vaultConstructorArgumentsChefLpWETHUSDC);
    vaultInitTxChefLpARBETH = await vaultInitTxChefLpARBETH.wait()
    vaultInitTxChefLpARBETH.status === 1
        ? console.log(`Vault Chef LP ARB-ETH Intilization done with tx: ${vaultInitTxChefLpARBETH.transactionHash}`)
        : console.log(`Vault Chef LP ARB-ETH Intilization failed with tx: ${vaultInitTxChefLpARBETH.transactionHash}`);

    // Verifications:
    try {

        //Strategy LP ARB-ETH verify
        await hardhat.run("verify:verify", {
            address: strategyZyberStable.address,
            constructorArguments: [...strategyConstructorArgumentsChef3pool],
        });

    } catch (error) {

    }

};

deploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });