import hardhat from "hardhat";
const { ethers } = hardhat;
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const privateKey = process.env.PRIVATE_KEY;
  const provider = new ethers.JsonRpcProvider("https://polygon-amoy.g.alchemy.com/v2/g-jcsI9Saz0GVQLJdXWeA");
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, [{"name": "submitClaim", "type": "function", "inputs": [{"name": "_claimant", "type": "address"}, {"name": "_claimType", "type": "uint8"}, {"name": "_requestedAmount", "type": "uint256"}, {"name": "_ipfsHash", "type": "string"}], "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "nonpayable"}], wallet);
  const tx = await contract.submitClaim(wallet.address, 0, ethers.parseEther("1000"), "QmTestIPFSHash");
  await tx.wait();
  console.log(`Claim submitted. Tx hash: ${tx.hash}`);
}

main().catch(console.error);