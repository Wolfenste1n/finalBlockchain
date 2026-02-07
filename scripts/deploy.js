const hre = require("hardhat");
async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", await deployer.getAddress());
  const Token = await hre.ethers.getContractFactory("Token");
  const tokenName = "CoffeeToken";
  const tokenSymbol = "CFT";
  const initSupply = hre.ethers.parseEther("1000000"); // 1 million tokens with 18 decimals
  const token = await Token.deploy(tokenName, tokenSymbol, initSupply, deployer.address);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("Token deployed to:", tokenAddress);
  console.log("Address: ", tokenAddress);


  const CoffeeGrainShop = await hre.ethers.getContractFactory("CoffeeGrainShop");
  const pricePerBag = hre.ethers.parseEther("10"); // 10 CFT per bag
  const shop = await CoffeeGrainShop.deploy(tokenAddress, pricePerBag);
  await shop.waitForDeployment();
  const shopAddress = await shop.getAddress();
  console.log("CoffeeGrainShop deployed to:");
  console.log("Address: ", shopAddress);

  console.log("\n Deployment complete!");
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
} );