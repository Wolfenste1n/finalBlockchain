const hre = require("hardhat");
async function main() {
    const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const Crowdfunding = await hre.ethers.getContractFactory("Crowdfunding");
    const goal = hre.ethers.parseEther("8000");
    const duration = 180 * 24 * 60 * 60; // 6 month in seconds
    const crowdfunding = await Crowdfunding.deploy(tokenAddress, goal, duration);
    await crowdfunding.waitForDeployment();
    console.log("Crowdfunding deployed to:", await crowdfunding.getAddress());
}
main().catch((error) => {    console.error(error)
    process.exitCode = 1;
});