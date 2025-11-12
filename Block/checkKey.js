import { Wallet } from "ethers";
import dotenv from "dotenv";

dotenv.config(); // loads PRIVATE_KEY from .env

async function main() {
  const wallet = new Wallet(process.env.PRIVATE_KEY);
  console.log("✅ Address derived from your private key:", wallet.address);
}

main().catch(console.error);
