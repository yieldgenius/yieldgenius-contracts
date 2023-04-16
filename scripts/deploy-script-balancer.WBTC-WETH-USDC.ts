import vaultV7 from "../artifacts/contracts/vaults/YieldGeniusVault.sol/YieldGeniusVault.json";
import { ethers } from "hardhat";

const hardhat = require("hardhat");

const feeRecipient = "0x129C5292fCC814Ca48EE753823aB22131eAf5689"


const strategyParamsStrategyChefCurveLP = {
    want: "0x30dF229cefa463e991e29D42DB0bae2e122B2AC7",
    poolId: 0,
    chef: "0x839de324a1ab773f76a53900d70ac1b913d2b387",
    pool: "0x30df229cefa463e991e29d42db0bae2e122b2ac7",
    poolSize: 2,
    depositIndex: 0,
    outputToNativeRoute: ["0x3E6648C5a70A150A88bCE65F4aD4d506Fe15d2AF", "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"],
    nativeToDepositRoute: ["0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", "0xFEa7a6a0B346362BF88A9e4A88416B77a57D6c2A"],
    unirouter: "0x1b02da8cb0d097eb8d57a175b88c7d8b47997506"
};


const vaultParamsBalancerwstETHETH = {
    vaultName: "YG Abrcdbr MIM-2CRV",
    vaultSymbol: "ygAbrcdbrMIM-2CRV",
    delay: 21600,
};


async function deploy() {
    const [account] = await ethers.getSigners();
    const deployerAddress = account.address;

    //Deploy Curve Abrcdbr MIM-2CRV  vault
    const VaultBalancerwstETHETH = await ethers.getContractFactory("YieldGeniusVault");
    const vaultBalancerwstETHETH = await VaultBalancerwstETHETH.deploy();
    const StrategyCurveStrategyChefCurveLP = await ethers.getContractFactory("StrategyChefCurveLP");

    await vaultBalancerwstETHETH.deployed();


    console.log("Vault Curve Abrcdbr MIM-2CRV  deployed to:", vaultBalancerwstETHETH.address);


    const strategyConstructorArgumentsCurveStrategyChefCurveLP = [
        strategyParamsStrategyChefCurveLP.want,
        strategyParamsStrategyChefCurveLP.poolId,
        strategyParamsStrategyChefCurveLP.chef,
        strategyParamsStrategyChefCurveLP.pool,
        strategyParamsStrategyChefCurveLP.poolSize,
        strategyParamsStrategyChefCurveLP.depositIndex,
        strategyParamsStrategyChefCurveLP.outputToNativeRoute,
        strategyParamsStrategyChefCurveLP.nativeToDepositRoute,
        vaultBalancerwstETHETH.address,
        strategyParamsStrategyChefCurveLP.unirouter,
        deployerAddress,
        deployerAddress,
        feeRecipient
    ];
    const strategyCurveStrategyChefCurveLP = await StrategyCurveStrategyChefCurveLP.deploy(...strategyConstructorArgumentsCurveStrategyChefCurveLP);
    await strategyCurveStrategyChefCurveLP.deployed();
    console.log("Startegy ChefCurveLP for vault Curve Abrcdbr MIM-2CRV deployed to:", strategyCurveStrategyChefCurveLP.address);

    const vaultConstructorArgumentsBalancerwstETHETH = [
        strategyCurveStrategyChefCurveLP.address,
        vaultParamsBalancerwstETHETH.vaultName,
        vaultParamsBalancerwstETHETH.vaultSymbol,
        vaultParamsBalancerwstETHETH.delay,
    ];

    const vaultContractBalancerwstETHETH = await ethers.getContractAt(vaultV7.abi, vaultBalancerwstETHETH.address);
    let vaultInitTxBalancerwstETHETH = await vaultContractBalancerwstETHETH.initialize(...vaultConstructorArgumentsBalancerwstETHETH);
    vaultInitTxBalancerwstETHETH = await vaultInitTxBalancerwstETHETH.wait()
    vaultInitTxBalancerwstETHETH.status === 1
        ? console.log(`Vault Curve Abrcdbr MIM-2CRV Intilization done with tx: ${vaultInitTxBalancerwstETHETH.transactionHash}`)
        : console.log(`Vault Curve Abrcdbr MIM-2CRV Intilization failed with tx: ${vaultInitTxBalancerwstETHETH.transactionHash}`);


    // Verifications:
    try {

        //Strategy  ChefCurveLP verify
        await hardhat.run("verify:verify", {
            address: strategyCurveStrategyChefCurveLP.address,
            constructorArguments: [...strategyConstructorArgumentsCurveStrategyChefCurveLP],
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