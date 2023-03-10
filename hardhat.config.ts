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
  },
  gasReporter: {
    enabled: true,
    currency: 'USD',
    coinmarketcap: process.env.CMC_API,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API,
  },
  mocha: {
    timeout: 400000000
  },
};

export default config;
