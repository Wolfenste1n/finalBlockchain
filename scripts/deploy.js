const hre = require("hardhat");

/**
 * Deploy Token Contract
 * 
 * Usage:
 *   npx hardhat run scripts/deploy.js --network localhost
 *   TOKEN_NAME="MyToken" TOKEN_SYMBOL="MTK" INITIAL_SUPPLY=1000000 npx hardhat run scripts/deploy.js --network localhost
 */
async function main() {
  // Get token parameters from environment variables or use defaults
  const tokenName = process.env.TOKEN_NAME || "MyToken";
  const tokenSymbol = process.env.TOKEN_SYMBOL || "MTK";
  const initialSupply = process.env.INITIAL_SUPPLY ? 
    BigInt(process.env.INITIAL_SUPPLY) : BigInt(1_000_000);

  console.log("\n🚀 Deploying Token Contract...\n");
  console.log("Token Name:", tokenName);
  console.log("Token Symbol:", tokenSymbol);
  console.log("Initial Supply:", initialSupply.toString(), "tokens\n");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy the contract
  console.log("⏳ Deploying contract...");
  const Token = await hre.ethers.getContractFactory("Token");
  const token = await Token.deploy(
    tokenName,
    tokenSymbol,
    initialSupply,
    deployer.address
  );

  await token.waitForDeployment();

  const address = await token.getAddress();
  console.log("\n✅ Deployment successful!\n");
  console.log("=".repeat(60));
  console.log("📄 Contract Address:", address);
  console.log("🏷️  Token Name:", await token.name());
  console.log("💱 Token Symbol:", await token.symbol());
  console.log("📊 Total Supply:", hre.ethers.formatEther(await token.totalSupply()), tokenSymbol);
  console.log("👤 Owner Balance:", hre.ethers.formatEther(await token.balanceOf(deployer.address)), tokenSymbol);
  console.log("=".repeat(60));
  console.log("\n✨ Token is ready to use!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });