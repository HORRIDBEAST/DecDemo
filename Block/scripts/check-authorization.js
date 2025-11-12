import hardhat from "hardhat";
const { ethers } = hardhat;
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const privateKey = process.env.PRIVATE_KEY;
  const provider = new ethers.JsonRpcProvider("https://polygon-amoy.g.alchemy.com/v2/g-jcsI9Saz0GVQLJdXWeA");
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, [{"name": "authorizedAgents", "type": "function", "inputs": [{"name": "agent", "type": "address"}], "outputs": [{"name": "", "type": "bool"}], "stateMutability": "view"}], provider);
  const isAuthorized = await contract.authorizedAgents(wallet.address);
  console.log(`Wallet ${wallet.address} is authorized: ${isAuthorized}`);
}

main().catch(console.error);