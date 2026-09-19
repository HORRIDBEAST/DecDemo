import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
dotenv.config();

export default {
  solidity: {
    version: "0.8.30", // 0.8.20 cannot target the "osaka" EVM version Monad requires
    settings: {
      evmVersion: "osaka",
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
    },
    monadTestnet: {
      url: process.env.WEB3_PROVIDER_URL || "https://testnet-rpc.monad.xyz",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 10143,
    },
  },
  // Verification: `npx hardhat verify --network monadTestnet <address> <deployer>`
  // publishes source to both MonadVision (Sourcify, no key) and Monadscan (Etherscan v2 key).
  sourcify: {
    enabled: true,
    apiUrl: "https://sourcify-api-monad.blockvision.org",
    browserUrl: "https://monadvision.com",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || process.env.POLYGONSCAN_API_KEY || "",
    customChains: [
      {
        network: "monadTestnet",
        chainId: 10143,
        urls: {
          apiURL: "https://api.etherscan.io/v2/api?chainid=10143",
          browserURL: "https://testnet.monadscan.com",
        },
      },
    ],
  },
};
