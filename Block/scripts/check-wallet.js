import hardhat from "hardhat";
const { ethers } = hardhat;

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("PRIVATE_KEY not set in .env");
    return;
  }

  const provider = new ethers.JsonRpcProvider(process.env.WEB3_PROVIDER_URL);
  const wallet = new ethers.Wallet(privateKey, provider);
  const balance = await provider.getBalance(wallet.address);
  console.log(`Wallet address: ${wallet.address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} MON`);
}

main().catch((error) => {
  console.error("Wallet check failed:", error);
});