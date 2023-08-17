import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "chai"


dotenv.config();

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",

  solidity: {
    compilers: [
      {
        version: "0.8.18",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ]
  },
  networks: {
    hardhat: {
    },
    arbitrum: {
      url: 'https://arbitrum.blockpi.network/v1/rpc/public',
      accounts: process.env.PRIVATE_KEY_ARBITRUM !== undefined ? [process.env.PRIVATE_KEY_ARBITRUM] : [],
      chainId: 42161,
    },
    'base-mainnet': {
      url: 'https://mainnet.base.org',
      accounts: process.env.PRIVATE_KEY_ARBITRUM !== undefined ? [process.env.PRIVATE_KEY_ARBITRUM] : [],
      chainId: 8453,
    },
  },
  gasReporter: {
    enabled: true,
    currency: 'USD',
    coinmarketcap: process.env.CMC_API,
  },
  etherscan: {
    apiKey: {
      arbitrum: 'AKXXQE6ZZXM8F6F5CS4EJK5DH3M596SK9J',
      'base-mainnet': 'YY6GP743U9KFKVHZW2T52IC8I8XZ5T9CV7'
    },
    customChains: [
      {
        network: "base-mainnet",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org/"
        }
      }
    ]
  },
  mocha: {
    timeout: 400000000
  },
};

export default config;
