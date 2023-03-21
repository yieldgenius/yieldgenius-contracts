import vaultV7 from "../artifacts/contracts/vaults/YieldGeniusVault.sol/YieldGeniusVault.json";
import feeConfiguratorParth from "../artifacts/contracts/utils/FeeConfigurator.sol/FeeConfigurator.json";
import { ethers } from "hardhat";

const hardhat = require("hardhat");

const feeRecipient = "0x129C5292fCC814Ca48EE753823aB22131eAf5689"
const CURVE = "0x11cDb42B0EB46D95f990BeDD4695A6e3fA034978"
const CVX = "0xb952A807345991BD529FDded05009F5e80Fe8F45"
const ETH = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"
const USDC = "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"
const strategyParamsCurveTriCrypto = {
    want: "0x8e0b8c8bb9db49a46697f3a5bb8a308e744821d2",
    pool: "0x960ea3e3c7fb317332d990873d354e18d7645590",
    zap: "0x0000000000000000000000000000000000000000",
    pid: 3,
    params: ["3", "2", 0, 0],
    unirouter: "0x1b02da8cb0d097eb8d57a175b88c7d8b47997506",
    crvToNativePath: ethers.utils.solidityPack(["address", "uint24", "address"], [CURVE, 1000, ETH]),
    cvxToNativePath: ethers.utils.solidityPack(["address", "uint24", "address"], [CVX, 1000, ETH]),
    nativeToDepositPath: [],
    nativeToDepositRoute: ["0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"],
};
const strategyParamsCurveUSDCUSDT = {
    want: "0x7f90122bf0700f9e7e1f688fe926940e8839f353",
    pool: "0x7f90122bf0700f9e7e1f688fe926940e8839f353",
    zap: "0x0000000000000000000000000000000000000000",
    pid: 1,
    params: ["2", "0", 0, 0], //[poolSize, depositIndex, useUnderlying, useDepositNative]
    unirouter: "0xe592427a0aece92de3edee1f18e0157c05861564",
    crvToNativePath: ethers.utils.solidityPack(["address", "uint24", "address"], [CURVE, 1000, ETH]),
    cvxToNativePath: ethers.utils.solidityPack(["address", "uint24", "address"], [CVX, 1000, ETH]),
    nativeToDepositPath: ethers.utils.solidityPack(["address", "uint24", "address"], [ETH, 1000, USDC]),
    nativeToDepositRoute: [],
};
const strategyParamsCurvewstETHETH = {
    want: "0xdbcd16e622c95acb2650b38ec799f76bfc557a0b",
    gaugeFactory: "0xabc000d88f23bb45525e447528dbf656a9d55bf5",
    gauge: "0x098ef55011b6b8c99845128114a9d9159777d697",
    pool: "0x6eb2dc694eb516b16dc9fbc678c60052bbdd7d80",
    params: ["2", "0", 0, 0], //[poolSize, depositIndex, useUnderlying, useMetapool]
    unirouter: "0xe592427a0aece92de3edee1f18e0157c05861564",
    paths: [ethers.utils.solidityPack(["address", "uint24", "address",], [CURVE, 1000, ETH]),
    ethers.utils.solidityPack(["address", "uint24", "address"], [ETH, 1000, ETH])
    ],
};
const strategyParamsGMXGLP = {
    want: "0x5402B5F40310bDED796c7D0F3FF6683f5C0cFfdf",
    native: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    minter: "0xB95DB5B167D75e6d04227CfFFA61069348d271F5",
    chef: "0xA906F338CB21815cBc4Bc87ace9e68c87eF8d8F1",
    outputToNativeRoute: ["0xd4d42F0b6DEF4CE0383636770eF773390d85c61A", "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"],
    rewardToOutputRoute: ["0x539bdE0d7Dbd336b79148AA742883198BBF60342", "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", "0xd4d42F0b6DEF4CE0383636770eF773390d85c61A"],
    outputToLp0Route: ["0xd4d42F0b6DEF4CE0383636770eF773390d85c61A", "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", "0x539bdE0d7Dbd336b79148AA742883198BBF60342"],
    outputToLp1Route: ["0xd4d42F0b6DEF4CE0383636770eF773390d85c61A", "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"],
    uniRouter: "0x0000000000000000000000000000000000000000"
};
const strategyParamsChefLpWETHUSDC = {
    want: "0x8b8149Dd385955DC1cE77a4bE7700CCD6a212e65",
    poolId: 3,
    chef: "0x9BA666165867E916Ee7Ed3a3aE6C19415C2fBDDD",
    unirouter: "0x16e71B13fE6079B4312063F7E81F76d165Ad32Ad",
    outputToNativeRoute: ["0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8"],
    outputToLp0Route: ["0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8"],
    outputToLp1Route: ["0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"],
};
const strategyParamsChefLpZYBUSDC = {
    want: "0x3eC0eddCd1e25025077327886A78133589082fB2",
    poolId: 1,
    chef: "0x9BA666165867E916Ee7Ed3a3aE6C19415C2fBDDD",
    unirouter: "0x16e71B13fE6079B4312063F7E81F76d165Ad32Ad",
    outputToNativeRoute: ["0x3B475F6f2f41853706afc9Fa6a6b8C5dF1a2724c", "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8"],
    outputToLp0Route: ["0x3B475F6f2f41853706afc9Fa6a6b8C5dF1a2724c", "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8"],
    outputToLp1Route: ["0x3B475F6f2f41853706afc9Fa6a6b8C5dF1a2724c"],
};
const strategyParamsChefLpZYBWETH = {
    want: "0xf69223B75D9CF7c454Bb44e30a3772202bEE72CF",
    poolId: 0,
    chef: "0x9BA666165867E916Ee7Ed3a3aE6C19415C2fBDDD",
    unirouter: "0x16e71B13fE6079B4312063F7E81F76d165Ad32Ad",
    outputToNativeRoute: ["0x3B475F6f2f41853706afc9Fa6a6b8C5dF1a2724c", "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"],
    outputToLp0Route: ["0x3B475F6f2f41853706afc9Fa6a6b8C5dF1a2724c", "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"],
    outputToLp1Route: ["0x3B475F6f2f41853706afc9Fa6a6b8C5dF1a2724c"],
};
const strategyParamsSushiMAGICETH = {
    want: "0xb7e50106a5bd3cf21af210a755f9c8740890a8c9",
    poolId: 13,
    chef: "0xf4d73326c13a4fc5fd7a064217e12780e9bd62c3",
    unirouter: "0x1b02da8cb0d097eb8d57a175b88c7d8b47997506",
    outputToNativeRoute: ["0xd4d42F0b6DEF4CE0383636770eF773390d85c61A", "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"],
    rewardToOutputRoute: ["0x539bdE0d7Dbd336b79148AA742883198BBF60342", "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", "0xd4d42F0b6DEF4CE0383636770eF773390d85c61A"],
    outputToLp0Route: ["0xd4d42F0b6DEF4CE0383636770eF773390d85c61A", "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", "0x539bdE0d7Dbd336b79148AA742883198BBF60342"],
    outputToLp1Route: ["0xd4d42F0b6DEF4CE0383636770eF773390d85c61A", "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"],
};

const vaultParamsCurveTriCrypto = {
    vaultName: "YG CurveTriCrypto",
    vaultSymbol: "ygCurveTriCrypto",
    delay: 21600,
};
const vaultParamsCurveUSDCUSDT = {
    vaultName: "YG CurveUSDC-USDT",
    vaultSymbol: "ygCurveUSDC-USDT",
    delay: 21600,
};
const vaultParamsCurvewstETHETH = {
    vaultName: "YG CurvewstETH-ETH",
    vaultSymbol: "ygCurvewstETH-ETH",
    delay: 21600,
};
const vaultParamsGMXGLP = {
    vaultName: "YG GMX-GLP",
    vaultSymbol: "ygGMX-GLP",
    delay: 21600,
};
const vaultParamsChefLpWETHUSDC = {
    vaultName: "YG WETH-USDC",
    vaultSymbol: "ygWETH-USDC",
    delay: 21600,
};
const vaultParamsChefLpZYBUSDC = {
    vaultName: "YG ZYB-USDC",
    vaultSymbol: "ygZYB-USDC",
    delay: 21600,
};
const vaultParamsChefLpZYBWETH = {
    vaultName: "YG ZYB-WETH",
    vaultSymbol: "ygZYB-WETH",
    delay: 21600,
};
const vaultParamsSushiMAGICETH = {
    vaultName: "YG MAGIC-ETH",
    vaultSymbol: "ygMAGIC-ETH",
    delay: 21600,
};

async function deploy() {
    const [account] = await ethers.getSigners();
    const deployerAddress = account.address;



    const FeeConfigurator = await ethers.getContractFactory("FeeConfigurator");
    const feeConfigurator = await FeeConfigurator.attach("0x85B1fcA863952068CeEcc40Fcb0A468e13d36c08");

    /*
        //Deploy Curve TriCrypto vault
        const StrategyConvexL2CurveTriCrpyto = await ethers.getContractFactory("StrategyConvexL2");
        const strategyConstructorArgumentsCurveTriCrypto = [
            strategyParamsCurveTriCrypto.want,
            strategyParamsCurveTriCrypto.pool,
            strategyParamsCurveTriCrypto.zap,
            strategyParamsCurveTriCrypto.pid,
            strategyParamsCurveTriCrypto.params,
            strategyParamsCurveTriCrypto.crvToNativePath,
            strategyParamsCurveTriCrypto.cvxToNativePath,
            strategyParamsCurveTriCrypto.nativeToDepositPath,
            strategyParamsCurveTriCrypto.nativeToDepositRoute,
            ["0x26855239B545C0022865a5257A0FD2d053bC398e",
                strategyParamsCurveTriCrypto.unirouter,
                deployerAddress,
                deployerAddress,
                feeRecipient,
                feeConfigurator.address],
        ];
    
        const strategyConvexL2CurveTriCrpyto = await StrategyConvexL2CurveTriCrpyto.attach("0xD06A376f3F0DD2f9533513489F0dD67e189C2b19");
    
        await strategyConvexL2CurveTriCrpyto.deployed();
    
        await hardhat.run("verify:verify", {
            address: strategyConvexL2CurveTriCrpyto.address,
            constructorArguments: [...strategyConstructorArgumentsCurveTriCrypto],
        });
    
    
    
        //Deploy Curve USDC-USDT vault
        const VaultCurveUSDCUSDT = await ethers.getContractFactory("YieldGeniusVault");
        const vaultCurveUSDCUSDT = await VaultCurveUSDCUSDT.attach("0xE2406161f1D6f91101a2D6D0523E84E38e637299");
        const StrategyConvexL2CurveUSDCUSDT = await ethers.getContractFactory("StrategyConvexL2");
        await vaultCurveUSDCUSDT.deployed();
        console.log("Vault Curve USDC-USDT deployed to:", vaultCurveUSDCUSDT.address);
        const strategyConstructorArgumentsCurveUSDCUSDT = [
            strategyParamsCurveUSDCUSDT.want,
            strategyParamsCurveUSDCUSDT.pool,
            strategyParamsCurveUSDCUSDT.zap,
            strategyParamsCurveUSDCUSDT.pid,
            strategyParamsCurveUSDCUSDT.params,
            strategyParamsCurveUSDCUSDT.crvToNativePath,
            strategyParamsCurveUSDCUSDT.cvxToNativePath,
            strategyParamsCurveUSDCUSDT.nativeToDepositPath,
            strategyParamsCurveUSDCUSDT.nativeToDepositRoute,
            [vaultCurveUSDCUSDT.address,
            strategyParamsCurveUSDCUSDT.unirouter,
                deployerAddress,
                deployerAddress,
                feeRecipient,
            feeConfigurator.address],
        ];
    
        const strategyConvexL2CurveUSDCUSDT = await StrategyConvexL2CurveUSDCUSDT.attach("0x614f6f6953e53E2D11f8a1c9f1FaD6C7903e3433");
    
        await strategyConvexL2CurveUSDCUSDT.deployed();
    
        await hardhat.run("verify:verify", {
            address: strategyConvexL2CurveUSDCUSDT.address,
            constructorArguments: [...strategyConstructorArgumentsCurveUSDCUSDT],
        });
   


    //Deploy Curve wstETH-ETH vault
    const VaultCurvewstETHETH = await ethers.getContractFactory("YieldGeniusVault")
    const vaultCurvewstETHETH = await VaultCurvewstETHETH.attach("0x9746761149161381f11Ad163E7895B9d4AdeAc92");
    const StrategyCurveLPUniV3RouterCurvewstETHETH = await ethers.getContractFactory("StrategyCurveLPUniV3Router")

    const strategyConstructorArgumentsCurvewstETHETH = [
        strategyParamsCurvewstETHETH.want,
        strategyParamsCurvewstETHETH.gaugeFactory,
        strategyParamsCurvewstETHETH.gauge,
        strategyParamsCurvewstETHETH.pool,
        strategyParamsCurvewstETHETH.params,
        strategyParamsCurvewstETHETH.paths,
        [vaultCurvewstETHETH.address,
        strategyParamsCurvewstETHETH.unirouter,
            deployerAddress,
            deployerAddress,
            feeRecipient,
        feeConfigurator.address],
    ];

    const strategyCurveLPUniV3RouterCurvewstETHETH = await StrategyCurveLPUniV3RouterCurvewstETHETH.attach("0x8DDF7fb39F47aaEb82bbD1564794ab62450AFBAD");

    await strategyCurveLPUniV3RouterCurvewstETHETH.deployed();

    await hardhat.run("verify:verify", {
        address: strategyCurveLPUniV3RouterCurvewstETHETH.address,
        constructorArguments: [...strategyConstructorArgumentsCurvewstETHETH],
    })


    //Deploy GMX-GLP vault
    const VaultGMXGLP = await ethers.getContractFactory("YieldGeniusVault")
    const vaultGMXGLP = await VaultGMXGLP.attach("0x1eee084D2657dD1eaE2B50ba4D0E209Eb3D4Eec9");
    const StrategyGLPGMXGLP = await ethers.getContractFactory("StrategyGLP")


    const strategyConstructorArgumentsGMXGLP = [
        strategyParamsGMXGLP.want,
        strategyParamsGMXGLP.native,
        strategyParamsGMXGLP.minter,
        strategyParamsGMXGLP.chef,
        [vaultGMXGLP.address,
        strategyParamsGMXGLP.uniRouter,
            deployerAddress,
            deployerAddress,
            feeRecipient,
        feeConfigurator.address],
    ];

    const strategyGlpGMXGLP = await StrategyGLPGMXGLP.attach("0xE075A04eF32745868cb9c48EbEd0d28689bD9a46");

    await hardhat.run("verify:verify", {
        address: strategyGlpGMXGLP.address,
        constructorArguments: [...strategyConstructorArgumentsGMXGLP],
    })





    //Deploy Chef LP WETH-USDC vault
    const VaultChefLpWETHUSDC = await ethers.getContractFactory("YieldGeniusVault")
    const vaultChefLpWETHUSDC = await VaultChefLpWETHUSDC.attach("0xED0B88309E890B8827A1f9665801019Be15CB039");
    const StrategyZyberMultiRewardsLPChefLpWETHUSDC = await ethers.getContractFactory("StrategyZyberMultiRewardsLP")


    const strategyConstructorArgumentsChefLpWETHUSDC = [
        strategyParamsChefLpWETHUSDC.want,
        strategyParamsChefLpWETHUSDC.poolId,
        strategyParamsChefLpWETHUSDC.chef,
        [vaultChefLpWETHUSDC.address,
        strategyParamsChefLpWETHUSDC.unirouter,
            deployerAddress,
            deployerAddress,
            feeRecipient,
        feeConfigurator.address],
        strategyParamsChefLpWETHUSDC.outputToNativeRoute,
        strategyParamsChefLpWETHUSDC.outputToLp0Route,
        strategyParamsChefLpWETHUSDC.outputToLp1Route
    ];

    const strategyCommonChefLPChefLpWETHUSDC = await StrategyZyberMultiRewardsLPChefLpWETHUSDC.attach("0x80265eB96A4720AAd85398261b8587C9Ed78F21f");

    await strategyCommonChefLPChefLpWETHUSDC.deployed();

    await hardhat.run("verify:verify", {
        address: strategyCommonChefLPChefLpWETHUSDC.address,
        constructorArguments: [...strategyConstructorArgumentsChefLpWETHUSDC],
    })




    //Deploy Chef LP ZYB-USDC vault
    const VaultChefLpZYBUSDC = await ethers.getContractFactory("YieldGeniusVault");
    const vaultChefLpZYBUSDC = await VaultChefLpZYBUSDC.attach("0xfABf99a55852D39fd07E2D98190204Ad6Ad6048d");
    const StrategyZyberMultiRewardsLPChefLpZYBUSDC = await ethers.getContractFactory("StrategyZyberMultiRewardsLP");



    const strategyConstructorArgumentsChefLpZYBUSDC = [
        strategyParamsChefLpZYBUSDC.want,
        strategyParamsChefLpZYBUSDC.poolId,
        strategyParamsChefLpZYBUSDC.chef,
        [vaultChefLpZYBUSDC.address,
        strategyParamsChefLpZYBUSDC.unirouter,
            deployerAddress,
            deployerAddress,
            feeRecipient,
        feeConfigurator.address],
        strategyParamsChefLpZYBUSDC.outputToNativeRoute,
        strategyParamsChefLpZYBUSDC.outputToLp0Route,
        strategyParamsChefLpZYBUSDC.outputToLp1Route
    ];

    const strategyCommonChefLPChefLpZYBUSDC = await StrategyZyberMultiRewardsLPChefLpZYBUSDC.attach("0x4bb917BEBA6be9e0192cFDb2D590e0DB17CF5C05");

    await strategyCommonChefLPChefLpZYBUSDC.deployed();
    await hardhat.run("verify:verify", {
        address: strategyCommonChefLPChefLpZYBUSDC.address,
        constructorArguments: [...strategyConstructorArgumentsChefLpZYBUSDC],
    });





    //Deploy Chef LP ZYB-WETH vault
    const VaultChefLpZYBWETH = await ethers.getContractFactory("YieldGeniusVault");
    const vaultChefLpZYBWETH = await VaultChefLpZYBWETH.attach("0xE5FC7B5d0B1FE7BAF4BF7b4BA649f06Af2436047");
    const StrategyZyberMultiRewardsLPChefLpZYBWETH = await ethers.getContractFactory("StrategyZyberMultiRewardsLP");

    const strategyConstructorArgumentsChefLpZYBWETH = [
        strategyParamsChefLpZYBWETH.want,
        strategyParamsChefLpZYBWETH.poolId,
        strategyParamsChefLpZYBWETH.chef,
        [vaultChefLpZYBWETH.address,
        strategyParamsChefLpZYBWETH.unirouter,
            deployerAddress,
            deployerAddress,
            feeRecipient,
        feeConfigurator.address],
        strategyParamsChefLpZYBWETH.outputToNativeRoute,
        strategyParamsChefLpZYBWETH.outputToLp0Route,
        strategyParamsChefLpZYBWETH.outputToLp1Route
    ];

    const strategyCommonChefLPChefLpZYBWETH = await StrategyZyberMultiRewardsLPChefLpZYBWETH.attach("0xFa08f46b84A453630AeBd37049A9878c6BEB6c70");

    await strategyCommonChefLPChefLpZYBWETH.deployed();

    await hardhat.run("verify:verify", {
        address: strategyCommonChefLPChefLpZYBWETH.address,
        constructorArguments: [...strategyConstructorArgumentsChefLpZYBWETH],
    });



 */
    //Deploy Sushi MAGIC-ETH vault
    const VaultSushiMAGICETH = await ethers.getContractFactory("YieldGeniusVault");
    const vaultSushiMAGICETH = await VaultSushiMAGICETH.attach("0x82B134f914382cd58ad93e9469C850c869Ff7cdE");
    const StrategyArbSushiDualLPSushiMAGICETH = await ethers.getContractFactory("StrategyArbSushiDualLP");


    const strategyConstructorArgumentsSushiMAGICETH = [
        strategyParamsSushiMAGICETH.want,
        strategyParamsSushiMAGICETH.poolId,
        strategyParamsSushiMAGICETH.chef,
        vaultSushiMAGICETH.address,
        strategyParamsSushiMAGICETH.unirouter,
        deployerAddress,
        deployerAddress,
        strategyParamsSushiMAGICETH.outputToNativeRoute,
        strategyParamsSushiMAGICETH.rewardToOutputRoute,
        strategyParamsSushiMAGICETH.outputToLp0Route,
        strategyParamsSushiMAGICETH.outputToLp1Route
    ];

    const strategyMagicEthSushiSushiMAGICETH = await StrategyArbSushiDualLPSushiMAGICETH.attach("0x09d84a67816733BeDf434B5FC77134657Ef7B51D");

    await strategyMagicEthSushiSushiMAGICETH.deployed();

    await hardhat.run("verify:verify", {
        address: strategyMagicEthSushiSushiMAGICETH.address,
        constructorArguments: [...strategyConstructorArgumentsSushiMAGICETH],
    })



};

deploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });