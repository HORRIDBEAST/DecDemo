import hardhat from "hardhat";
const { ethers } = hardhat;

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.WEB3_PROVIDER_URL);
  const network = await provider.getNetwork();
  console.log(`Connected to chain ID: ${network.chainId}`);
  console.log(`Network name: ${network.name}`);
  const blockNumber = await provider.getBlockNumber();
  console.log(`Latest block number: ${blockNumber}`);
}

main().catch((error) => {
  console.error("Web3 connection failed:", error);
});