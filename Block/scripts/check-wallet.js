import hardhat from "hardhat";
const { ethers } = hardhat;

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("PRIVATE_KEY not set in .env");
    return;
  }

  const provider = new ethers.JsonRpcProvider(`https://polygon-amoy.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`);
  const wallet = new ethers.Wallet(privateKey, provider);
  const balance = await provider.getBalance(wallet.address);
  console.log(`Wallet address: ${wallet.address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} MATIC`);
}

main().catch((error) => {
  console.error("Wallet check failed:", error);
});