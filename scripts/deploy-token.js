const hre = require("hardhat");
const tokensConfig = require("../tokens.config.js");

/**
 * Deploy Token from Configuration File
 * 
 * Usage:
 *   npx hardhat run scripts/deploy-token.js --network localhost
 *   TOKEN=aliya npx hardhat run scripts/deploy-token.js --network localhost
 */
async function main() {
  // Get token name from environment variable or use first token in config
  const tokenKey = process.env.TOKEN || Object.keys(tokensConfig)[0];
  
  if (!tokensConfig[tokenKey]) {
    console.error(`\n❌ Token "${tokenKey}" not found in tokens.config.js\n`);
    console.log("Available tokens:", Object.keys(tokensConfig).join(", "));
    process.exit(1);
  }

  const tokenConfig = tokensConfig[tokenKey];
  const tokenName = tokenConfig.name;
  const tokenSymbol = tokenConfig.symbol;
  const initialSupply = BigInt(tokenConfig.initialSupply);

  console.log(`\n🚀 Deploying ${tokenName} (${tokenSymbol})...\n`);
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