const hre = require("hardhat");

async function main() {
  const tokenName = process.env.TOKEN_NAME || "CoffeeToken";
  const tokenSymbol = process.env.TOKEN_SYMBOL || "CFT";
  const initialSupply = process.env.INITIAL_SUPPLY ? 
    BigInt(process.env.INITIAL_SUPPLY) : BigInt(1_000_000);

  console.log(" Deploying Token Contract...\n");
  console.log("Token Name:", tokenName);
  console.log("Token Symbol:", tokenSymbol);
  console.log("Initial Supply:", initialSupply.toString(), "tokens\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log(" Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(" Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  console.log(" Deploying contract...");
  const Token = await hre.ethers.getContractFactory("Token");
  const token = await Token.deploy(
    tokenName,
    tokenSymbol,
    initialSupply,
    deployer.address
  );

  await token.waitForDeployment();

  const address = await token.getAddress();
  console.log(" Deployment successful!\n");
  console.log("=".repeat(60));
  console.log(" Contract Address:", address);
  console.log("  Token Name:", await token.name());
  console.log(" Token Symbol:", await token.symbol());
  console.log(" Total Supply:", hre.ethers.formatEther(await token.totalSupply()), tokenSymbol);
  console.log(" Owner Balance:", hre.ethers.formatEther(await token.balanceOf(deployer.address)), tokenSymbol);
  console.log("=".repeat(60));
  console.log(" Token is ready to use!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(" Deployment failed:");
    console.error(error);
    process.exit(1);
  });