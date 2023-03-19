import vaultV7 from "../artifacts/contracts/vaults/YieldGeniusVault.sol/YieldGeniusVault.json";
import feeConfiguratorParth from "../artifacts/contracts/utils/FeeConfigurator.sol/FeeConfigurator.json";
import { ethers } from "hardhat";

const hardhat = require("hardhat");

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
    vaultName: "Test CurveTriCrypto",
    vaultSymbol: "Test-CurveTriCrypto",
    delay: 21600,
};
const vaultParamsCurveUSDCUSDT = {
    vaultName: "Test CurveUSDC-USDT",
    vaultSymbol: "Test-CurveUSDC-USDT",
    delay: 21600,
};
const vaultParamsCurvewstETHETH = {
    vaultName: "Test CurvewstETH-ETH",
    vaultSymbol: "Test-CurvewstETH-ETH",
    delay: 21600,
};
const vaultParamsGMXGLP = {
    vaultName: "TestGMX-GLP",
    vaultSymbol: "testGMX-GLP",
    delay: 21600,
};
const vaultParamsChefLpWETHUSDC = {
    vaultName: "TestWETH-USDC",
    vaultSymbol: "testWETH-USDC",
    delay: 21600,
};
const vaultParamsChefLpZYBUSDC = {
    vaultName: "TestZYB-USDC",
    vaultSymbol: "testZYB-USDC",
    delay: 21600,
};
const vaultParamsChefLpZYBWETH = {
    vaultName: "TestZYB-WETH",
    vaultSymbol: "testZYB-WETH",
    delay: 21600,
};
const vaultParamsSushiMAGICETH = {
    vaultName: "TestMAGIC-ETH",
    vaultSymbol: "testMAGIC-ETH",
    delay: 21600,
};

async function deploy() {
    const [account] = await ethers.getSigners();
    const deployerAddress = account.address;

    //Deploy FeeConfigurator

    const FeeConfigurator = await ethers.getContractFactory("FeeConfigurator");
    const feeConfigurator = await FeeConfigurator.deploy();
    await feeConfigurator.deployed();
    console.log("FeeConfigurator is deploy to address:", feeConfigurator.address);

    const feeConfiguratorContract = await ethers.getContractAt(feeConfiguratorParth.abi, feeConfigurator.address);
    let feeConfiguratorInit = await feeConfiguratorContract.initialize(deployerAddress, "95000000000000000");
    feeConfiguratorInit = await feeConfiguratorInit.wait()
    feeConfiguratorInit.status === 1
        ? console.log(`Fee Configurator initialized with tx: ${feeConfiguratorInit.transactionHash}`)
        : console.log(`Fee Configurator intilization failed with tx: ${feeConfiguratorInit.transactionHash}`);

    let feeConfiguratorSetFeeCat = await feeConfiguratorContract.setFeeCategory("0", "95000000000000000", "5000000000000000", "5000000000000000", "default", 1, 1);
    feeConfiguratorSetFeeCat = await feeConfiguratorSetFeeCat.wait()
    feeConfiguratorSetFeeCat.status === 1
        ? console.log(`Fee category is set with tx: ${feeConfiguratorSetFeeCat.transactionHash}`)
        : console.log(`Fee category setting failed with tx ${feeConfiguratorSetFeeCat.transactionHash}`);


    //Verify FeeConfigurator 
    await hardhat.run("verify:verify", {
        address: feeConfigurator.address,
        constructorArguments: [],
    })

    //Deploy Curve TriCrypto vault
    const VaultCurveTriCrypto = await ethers.getContractFactory("YieldGeniusVault");
    const vaultCurveTriCrypto = await VaultCurveTriCrypto.deploy();
    const StrategyConvexL2CurveTriCrpyto = await ethers.getContractFactory("StrategyConvexL2");

    await vaultCurveTriCrypto.deployed();
    console.log("Vault Curve TriCrpyto deployed to:", vaultCurveTriCrypto.address);

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
        [vaultCurveTriCrypto.address,
        strategyParamsCurveTriCrypto.unirouter,
            deployerAddress,
            deployerAddress,
            deployerAddress,
        feeConfigurator.address],
    ];

    const strategyConvexL2CurveTriCrpyto = await StrategyConvexL2CurveTriCrpyto.deploy(...strategyConstructorArgumentsCurveTriCrypto);

    await strategyConvexL2CurveTriCrpyto.deployed();

    console.log("Startegy StrategyConvexL2 for vault Curve TriCrpyto deployed to:", strategyConvexL2CurveTriCrpyto.address);

    const vaultConstructorArgumentsCurveTriCrypto = [
        strategyConvexL2CurveTriCrpyto.address,
        vaultParamsCurveTriCrypto.vaultName,
        vaultParamsCurveTriCrypto.vaultSymbol,
        vaultParamsCurveTriCrypto.delay,
    ];

    const vaultContractCurveTriCrypto = await ethers.getContractAt(vaultV7.abi, vaultCurveTriCrypto.address);
    let vaultInitTxCurveTriCrypto = await vaultContractCurveTriCrypto.initialize(...vaultConstructorArgumentsCurveTriCrypto);
    vaultInitTxCurveTriCrypto = await vaultInitTxCurveTriCrypto.wait()
    vaultInitTxCurveTriCrypto.status === 1
        ? console.log(`Vault Curve TriCrpyto Intilization done with tx: ${vaultInitTxCurveTriCrypto.transactionHash}`)
        : console.log(`Vault Curve TriCrpyto Intilization failed with tx: ${vaultInitTxCurveTriCrypto.transactionHash}`);

    //Vault Curve TriCrypto verify
    await hardhat.run("verify:verify", {
        address: vaultCurveTriCrypto.address,
        constructorArguments: [],
    })
    //Strategy Curve TriCrypto Vault verify
    await hardhat.run("verify:verify", {
        address: strategyConvexL2CurveTriCrpyto.address,
        constructorArguments: [...strategyConstructorArgumentsCurveTriCrypto],
    });

    //Deploy Curve USDC-USDT vault
    const VaultCurveUSDCUSDT = await ethers.getContractFactory("YieldGeniusVault");
    const vaultCurveUSDCUSDT = await VaultCurveUSDCUSDT.deploy();
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
            deployerAddress,
        feeConfigurator.address],
    ];

    const strategyConvexL2CurveUSDCUSDT = await StrategyConvexL2CurveUSDCUSDT.deploy(...strategyConstructorArgumentsCurveUSDCUSDT);

    await strategyConvexL2CurveUSDCUSDT.deployed();

    console.log("Startegy StrategyConvexL2 for vault Curve USDC-USDT deployed to:", strategyConvexL2CurveUSDCUSDT.address);

    const vaultConstructorArguments = [
        strategyConvexL2CurveUSDCUSDT.address,
        vaultParamsCurveUSDCUSDT.vaultName,
        vaultParamsCurveUSDCUSDT.vaultSymbol,
        vaultParamsCurveUSDCUSDT.delay,
    ];

    const vaultContractCurveUSDCUSDT = await ethers.getContractAt(vaultV7.abi, vaultCurveUSDCUSDT.address);
    let vaultInitTxCurveUSDCUSDT = await vaultContractCurveUSDCUSDT.initialize(...vaultConstructorArguments);
    vaultInitTxCurveUSDCUSDT = await vaultInitTxCurveUSDCUSDT.wait()
    vaultInitTxCurveUSDCUSDT.status === 1
        ? console.log(`Vault Curve USDC-USDT Intilization done with tx: ${vaultInitTxCurveUSDCUSDT.transactionHash}`)
        : console.log(`Vault Curve USDC-USDT Intilization failed with tx: ${vaultInitTxCurveUSDCUSDT.transactionHash}`);

    //Vault Curve USDC-USDT verify
    await hardhat.run("verify:verify", {
        address: vaultCurveUSDCUSDT.address,
        constructorArguments: [],
    })
    //Strategy Curve USDC-USDT vault verify
    await hardhat.run("verify:verify", {
        address: strategyConvexL2CurveUSDCUSDT.address,
        constructorArguments: [...strategyConstructorArgumentsCurveUSDCUSDT],
    });

    //Deploy Curve wstETH-ETH vault
    const VaultCurvewstETHETH = await ethers.getContractFactory("YieldGeniusVault")
    const vaultCurvewstETHETH = await VaultCurvewstETHETH.deploy();
    const StrategyCurveLPUniV3RouterCurvewstETHETH = await ethers.getContractFactory("StrategyCurveLPUniV3Router")

    await vaultCurvewstETHETH.deployed();
    console.log("Vault Curve wstETH-ETH deployed to:", vaultCurvewstETHETH.address);
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
            deployerAddress,
        feeConfigurator.address],
    ];

    const strategyCurveLPUniV3RouterCurvewstETHETH = await StrategyCurveLPUniV3RouterCurvewstETHETH.deploy(...strategyConstructorArgumentsCurvewstETHETH);

    await strategyCurveLPUniV3RouterCurvewstETHETH.deployed();

    console.log("Startegy StrategyCurveLPUniV3Router for vault Curve wstETH-ETH deployed to:", strategyCurveLPUniV3RouterCurvewstETHETH.address);

    const vaultConstructorArgumentsCurvewstETHETH = [
        strategyCurveLPUniV3RouterCurvewstETHETH.address,
        vaultParamsCurvewstETHETH.vaultName,
        vaultParamsCurvewstETHETH.vaultSymbol,
        vaultParamsCurvewstETHETH.delay,
    ];

    const vaultContractCurvewstETHETH = await ethers.getContractAt(vaultV7.abi, vaultCurvewstETHETH.address);
    let vaultInitTxCurvewstETHETH = await vaultContractCurvewstETHETH.initialize(...vaultConstructorArgumentsCurvewstETHETH);
    vaultInitTxCurvewstETHETH = await vaultInitTxCurvewstETHETH.wait()
    vaultInitTxCurvewstETHETH.status === 1
        ? console.log(`Vault Curve wstETH-ETH Intilization done with tx: ${vaultInitTxCurvewstETHETH.transactionHash}`)
        : console.log(`Vault Curve wstETH-ETH Intilization failed with tx: ${vaultInitTxCurvewstETHETH.transactionHash}`);


    //Vault Curve wstETH-ETH verify
    await hardhat.run("verify:verify", {
        address: vaultCurvewstETHETH.address,
        constructorArguments: [],
    })
    //Strategy Curve wstETH-ETH vault verify
    await hardhat.run("verify:verify", {
        address: strategyCurveLPUniV3RouterCurvewstETHETH.address,
        constructorArguments: [...strategyConstructorArgumentsCurvewstETHETH],
    })

    //Deploy GMX-GLP vault
    const VaultGMXGLP = await ethers.getContractFactory("YieldGeniusVault")
    const vaultGMXGLP = await VaultGMXGLP.deploy();
    const StrategyGLPGMXGLP = await ethers.getContractFactory("StrategyGLP")

    await vaultGMXGLP.deployed();
    console.log("Vault GMX-GLP deployed to:", vaultGMXGLP.address);

    const strategyConstructorArgumentsGMXGLP = [
        strategyParamsGMXGLP.want,
        strategyParamsGMXGLP.native,
        strategyParamsGMXGLP.minter,
        strategyParamsGMXGLP.chef,
        [vaultGMXGLP.address,
        strategyParamsGMXGLP.uniRouter,
            deployerAddress,
            deployerAddress,
            deployerAddress,
        feeConfigurator.address],
    ];

    const strategyGlpGMXGLP = await StrategyGLPGMXGLP.deploy(...strategyConstructorArgumentsGMXGLP);

    await strategyGlpGMXGLP.deployed();

    console.log("Startegy StrategyGLP for vault GMX-GLP deployed to:", strategyGlpGMXGLP.address);

    const vaultConstructorArgumentsGMXGLP = [
        strategyGlpGMXGLP.address,
        vaultParamsGMXGLP.vaultName,
        vaultParamsGMXGLP.vaultSymbol,
        vaultParamsGMXGLP.delay,
    ];

    const vaultContractGMXGLP = await ethers.getContractAt(vaultV7.abi, vaultGMXGLP.address);
    let vaultInitTxGMXGLP = await vaultContractGMXGLP.initialize(...vaultConstructorArgumentsGMXGLP);
    vaultInitTxGMXGLP = await vaultInitTxGMXGLP.wait()
    vaultInitTxGMXGLP.status === 1
        ? console.log(`Vault GMX-GLP Intilization done with tx: ${vaultInitTxGMXGLP.transactionHash}`)
        : console.log(`Vault GMX-GLP Intilization failed with tx: ${vaultInitTxGMXGLP.transactionHash}`);



    //Vault GMX-GLP  verify
    await hardhat.run("verify:verify", {
        address: vaultGMXGLP.address,
        constructorArguments: [],
    })
    //Strategy GMX-GLP vault verify
    await hardhat.run("verify:verify", {
        address: strategyGlpGMXGLP.address,
        constructorArguments: [...strategyConstructorArgumentsGMXGLP],
    })

    //Deploy Chef LP WETH-USDC vault
    const VaultChefLpWETHUSDC = await ethers.getContractFactory("YieldGeniusVault")
    const vaultChefLpWETHUSDC = await VaultChefLpWETHUSDC.deploy();
    const StrategyZyberMultiRewardsLPChefLpWETHUSDC = await ethers.getContractFactory("StrategyZyberMultiRewardsLP")

    await vaultChefLpWETHUSDC.deployed();
    console.log("Vault Chef LP WETH-USDC deployed to:", vaultChefLpWETHUSDC.address);

    const strategyConstructorArgumentsChefLpWETHUSDC = [
        strategyParamsChefLpWETHUSDC.want,
        strategyParamsChefLpWETHUSDC.poolId,
        strategyParamsChefLpWETHUSDC.chef,
        [vaultChefLpWETHUSDC.address,
        strategyParamsChefLpWETHUSDC.unirouter,
            deployerAddress,
            deployerAddress,
            deployerAddress,
        feeConfigurator.address],
        strategyParamsChefLpWETHUSDC.outputToNativeRoute,
        strategyParamsChefLpWETHUSDC.outputToLp0Route,
        strategyParamsChefLpWETHUSDC.outputToLp1Route
    ];

    const strategyCommonChefLPChefLpWETHUSDC = await StrategyZyberMultiRewardsLPChefLpWETHUSDC.deploy(...strategyConstructorArgumentsChefLpWETHUSDC);

    await strategyCommonChefLPChefLpWETHUSDC.deployed();

    console.log("Startegy StrategyZyberMultiRewardsLP for vault Chef LP WETH-USDC deployed to:", strategyCommonChefLPChefLpWETHUSDC.address);

    const vaultConstructorArgumentsChefLpWETHUSDC = [
        strategyCommonChefLPChefLpWETHUSDC.address,
        vaultParamsChefLpWETHUSDC.vaultName,
        vaultParamsChefLpWETHUSDC.vaultSymbol,
        vaultParamsChefLpWETHUSDC.delay,
    ];

    const vaultContractChefLpWETHUSDC = await ethers.getContractAt(vaultV7.abi, vaultChefLpWETHUSDC.address);
    let vaultInitTxChefLpWETHUSDC = await vaultContractChefLpWETHUSDC.initialize(...vaultConstructorArgumentsChefLpWETHUSDC);
    vaultInitTxChefLpWETHUSDC = await vaultInitTxChefLpWETHUSDC.wait()
    vaultInitTxChefLpWETHUSDC.status === 1
        ? console.log(`Vault Chef LP WETH-USDC Intilization done with tx: ${vaultInitTxChefLpWETHUSDC.transactionHash}`)
        : console.log(`Vault Chef LP WETH-USDC Intilization failed with tx: ${vaultInitTxChefLpWETHUSDC.transactionHash}`);

    //Vault Chef LP WETH-USDC verify
    await hardhat.run("verify:verify", {
        address: vaultChefLpWETHUSDC.address,
        constructorArguments: [],
    })
    //Strategy Chef LP WETH-USDC vault verify
    await hardhat.run("verify:verify", {
        address: strategyCommonChefLPChefLpWETHUSDC.address,
        constructorArguments: [...strategyConstructorArgumentsChefLpWETHUSDC],
    })

    //Deploy Chef LP ZYB-USDC vault
    const VaultChefLpZYBUSDC = await ethers.getContractFactory("YieldGeniusVault");
    const vaultChefLpZYBUSDC = await VaultChefLpZYBUSDC.deploy();
    const StrategyZyberMultiRewardsLPChefLpZYBUSDC = await ethers.getContractFactory("StrategyZyberMultiRewardsLP");

    await vaultChefLpZYBUSDC.deployed();
    console.log("Vault Chef LP ZYB-USDC deployed to:", vaultChefLpZYBUSDC.address);

    const strategyConstructorArgumentsChefLpZYBUSDC = [
        strategyParamsChefLpZYBUSDC.want,
        strategyParamsChefLpZYBUSDC.poolId,
        strategyParamsChefLpZYBUSDC.chef,
        [vaultChefLpZYBUSDC.address,
        strategyParamsChefLpZYBUSDC.unirouter,
            deployerAddress,
            deployerAddress,
            deployerAddress,
        feeConfigurator.address],
        strategyParamsChefLpZYBUSDC.outputToNativeRoute,
        strategyParamsChefLpZYBUSDC.outputToLp0Route,
        strategyParamsChefLpZYBUSDC.outputToLp1Route
    ];

    const strategyCommonChefLPChefLpZYBUSDC = await StrategyZyberMultiRewardsLPChefLpZYBUSDC.deploy(...strategyConstructorArgumentsChefLpZYBUSDC);

    await strategyCommonChefLPChefLpZYBUSDC.deployed();

    console.log("Startegy StrategyZyberMultiRewardsLP for vault Chef LP ZYB-USDC deployed to:", strategyCommonChefLPChefLpZYBUSDC.address);

    const vaultConstructorArgumentsChefLpZYBUSDC = [
        strategyCommonChefLPChefLpZYBUSDC.address,
        vaultParamsChefLpZYBUSDC.vaultName,
        vaultParamsChefLpZYBUSDC.vaultSymbol,
        vaultParamsChefLpZYBUSDC.delay,
    ];

    const vaultContractChefLpZYBUSDC = await ethers.getContractAt(vaultV7.abi, vaultChefLpZYBUSDC.address);
    let vaultInitTxChefLpZYBUSDC = await vaultContractChefLpZYBUSDC.initialize(...vaultConstructorArgumentsChefLpZYBUSDC);
    vaultInitTxChefLpZYBUSDC = await vaultInitTxChefLpZYBUSDC.wait()
    vaultInitTxChefLpZYBUSDC.status === 1
        ? console.log(`Vault Chef LP ZYB-USDC Intilization done with tx: ${vaultInitTxChefLpZYBUSDC.transactionHash}`)
        : console.log(`Vault Chef LP ZYB-USDC Intilization failed with tx: ${vaultInitTxChefLpZYBUSDC.transactionHash}`);

    //Vault Chef LP ZYB-USDC verify
    await hardhat.run("verify:verify", {
        address: vaultChefLpZYBUSDC.address,
        constructorArguments: [],
    })
    //Strategy Chef LP ZYB-USDC vault verify
    await hardhat.run("verify:verify", {
        address: strategyCommonChefLPChefLpZYBUSDC.address,
        constructorArguments: [...strategyConstructorArgumentsChefLpZYBUSDC],
    });

    //Deploy Chef LP ZYB-WETH vault
    const VaultChefLpZYBWETH = await ethers.getContractFactory("YieldGeniusVault");
    const vaultChefLpZYBWETH = await VaultChefLpZYBWETH.deploy();
    const StrategyZyberMultiRewardsLPChefLpZYBWETH = await ethers.getContractFactory("StrategyZyberMultiRewardsLP");

    await vaultChefLpZYBWETH.deployed();
    console.log("Vault Chef LP ZYB-WETH deployed to:", vaultChefLpZYBWETH.address);

    const strategyConstructorArgumentsChefLpZYBWETH = [
        strategyParamsChefLpZYBWETH.want,
        strategyParamsChefLpZYBWETH.poolId,
        strategyParamsChefLpZYBWETH.chef,
        [vaultChefLpZYBWETH.address,
        strategyParamsChefLpZYBWETH.unirouter,
            deployerAddress,
            deployerAddress,
            deployerAddress,
        feeConfigurator.address],
        strategyParamsChefLpZYBWETH.outputToNativeRoute,
        strategyParamsChefLpZYBWETH.outputToLp0Route,
        strategyParamsChefLpZYBWETH.outputToLp1Route
    ];

    const strategyCommonChefLPChefLpZYBWETH = await StrategyZyberMultiRewardsLPChefLpZYBWETH.deploy(...strategyConstructorArgumentsChefLpZYBWETH);

    await strategyCommonChefLPChefLpZYBWETH.deployed();

    console.log("Startegy StrategyZyberMultiRewardsLP for vault Chef LP ZYB-WETH deployed to:", strategyCommonChefLPChefLpZYBWETH.address);

    const vaultConstructorArgumentsChefLpZYBWETH = [
        strategyCommonChefLPChefLpZYBWETH.address,
        vaultParamsChefLpZYBWETH.vaultName,
        vaultParamsChefLpZYBWETH.vaultSymbol,
        vaultParamsChefLpZYBWETH.delay,
    ];

    const vaultContractChefLpZYBWETH = await ethers.getContractAt(vaultV7.abi, vaultChefLpZYBWETH.address);
    let vaultInitTxChefLpZYBWETH = await vaultContractChefLpZYBWETH.initialize(...vaultConstructorArgumentsChefLpZYBWETH);
    vaultInitTxChefLpZYBWETH = await vaultInitTxChefLpZYBWETH.wait()
    vaultInitTxChefLpZYBWETH.status === 1
        ? console.log(`Vault Chef LP ZYB-WETH Intilization done with tx: ${vaultInitTxChefLpZYBWETH.transactionHash}`)
        : console.log(`Vault Chef LP ZYB-WETH Intilization failed with tx: ${vaultInitTxChefLpZYBWETH.transactionHash}`);

    //Vault Chef LP ZYB-WETH verify
    await hardhat.run("verify:verify", {
        address: vaultChefLpZYBWETH.address,
        constructorArguments: [],
    });
    //Strategy Chef LP ZYB-WETH vault verify
    await hardhat.run("verify:verify", {
        address: strategyCommonChefLPChefLpZYBWETH.address,
        constructorArguments: [...strategyConstructorArgumentsChefLpZYBWETH],
    });

    //Deploy Sushi MAGIC-ETH vault
    const VaultSushiMAGICETH = await ethers.getContractFactory("YieldGeniusVault");
    const vaultSushiMAGICETH = await VaultSushiMAGICETH.deploy();
    const StrategyArbSushiDualLPSushiMAGICETH = await ethers.getContractFactory("StrategyArbSushiDualLP");

    await vaultSushiMAGICETH.deployed();
    console.log("Vault Sushi MAGIC-ETH deployed to:", vaultSushiMAGICETH.address);

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

    const strategyMagicEthSushiSushiMAGICETH = await StrategyArbSushiDualLPSushiMAGICETH.deploy(...strategyConstructorArgumentsSushiMAGICETH);

    await strategyMagicEthSushiSushiMAGICETH.deployed();

    console.log("Startegy StrategyArbSushiDualLP for vault Sushi MAGIC-ETH deployed to:", strategyMagicEthSushiSushiMAGICETH.address);

    const vaultConstructorArgumentsSushiMAGICETH = [
        strategyMagicEthSushiSushiMAGICETH.address,
        vaultParamsSushiMAGICETH.vaultName,
        vaultParamsSushiMAGICETH.vaultSymbol,
        vaultParamsSushiMAGICETH.delay,
    ];

    const vaultContractSushiMAGICETH = await ethers.getContractAt(vaultV7.abi, vaultSushiMAGICETH.address);
    let vaultInitTxSushiMAGICETH = await vaultContractSushiMAGICETH.initialize(...vaultConstructorArgumentsSushiMAGICETH);
    vaultInitTxSushiMAGICETH = await vaultInitTxSushiMAGICETH.wait()
    vaultInitTxSushiMAGICETH.status === 1
        ? console.log(`Vault Sushi MAGIC-ETH Intilization done with tx: ${vaultInitTxSushiMAGICETH.transactionHash}`)
        : console.log(`Vault Sushi MAGIC-ETH Intilization failed with tx: ${vaultInitTxSushiMAGICETH.transactionHash}`);

    //Vault Sushi MAGIC-ETH verify
    await hardhat.run("verify:verify", {
        address: vaultSushiMAGICETH.address,
        constructorArguments: [],
    })
    //Strategy Sushi MAGIC-ETH vault verify
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