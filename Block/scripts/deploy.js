import hardhat from "hardhat";
const { ethers } = hardhat;

async function main() {
  console.log("Deploying ClaimRegistry contract...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Deploy contract with initial owner parameter
  const ClaimRegistry = await ethers.getContractFactory("ClaimRegistry");
  const claimRegistry = await ClaimRegistry.deploy(deployer.address); // Pass initial owner

  await claimRegistry.waitForDeployment();
  const address = await claimRegistry.getAddress();
  console.log(`ClaimRegistry deployed to: ${address}`);

  // Authorize deployer as an agent (for testing)
  console.log("Authorizing deployer as an agent...");
  const tx = await claimRegistry.addAuthorizedAgent(deployer.address);
  await tx.wait();
  console.log(`Address ${deployer.address} authorized as agent.`);

  // Create deployments directory if it doesn't exist
  const fs = await import("fs");
  const path = await import("path");
  const deploymentsDir = "deployments";
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info
  const deploymentInfo = {
    address: address,
    transactionHash: claimRegistry.deploymentTransaction().hash,
    network: hardhat.network.name,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
  };
  
  const deploymentPath = path.join(deploymentsDir, `${hardhat.network.name}.json`);
  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("Deployment info saved to:", deploymentPath);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});