import vaultV7 from "../artifacts/contracts/vaults/YieldGeniusVault.sol/YieldGeniusVault.json";
import Strategy from "../artifacts/contracts/strategies/common/StrategyCommonSolidlyStakerLP.sol/StrategyCommonSolidlyStakerLP.json";
import { ethers } from "hardhat";

const hardhat = require("hardhat");

const RAM = "0xAAA6C1E32C55A7Bfa8066A6FAE9b42650F262418"
const WETH = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"
const USDC = "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"
const FRAX = "0x17FC002b466eEc40DaE837Fc4bE5c67993ddBd6F"

async function deploy() {
    const [account] = await ethers.getSigners();
    const deployerAddress = account.address;

    //Deploy RamsesFRAXUSDC vault
    const VaultContract = await ethers.getContractFactory("YieldGeniusVault");
    const vaultAddress = await VaultContract.attach("0x491174f5B2627f7C7669cfD72821B963eb026171");
    const vault = await ethers.getContractAt(vaultV7.abi, vaultAddress.address);


    console.log(await vault.deposit(1800000000000)); 

};

deploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });