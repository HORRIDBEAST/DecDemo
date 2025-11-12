import hardhat from "hardhat";
const { ethers } = hardhat;

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.error("CONTRACT_ADDRESS not set in .env");
    return;
  }

  const provider = new ethers.JsonRpcProvider("https://polygon-amoy.g.alchemy.com/v2/g-jcsI9Saz0GVQLJdXWeA");
  const code = await provider.getCode(contractAddress);
  if (code === "0x") {
    console.error("Contract address is invalid or not deployed");
  } else {
    console.log(`Contract at ${contractAddress} is deployed. Bytecode length: ${code.length}`);
  }
}

main().catch((error) => {
  console.error("Contract check failed:", error);
});