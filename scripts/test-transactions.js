const hre = require("hardhat");

async function main() {
  const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const MyToken = await hre.ethers.getContractFactory("Token");
  const token = await MyToken.attach(tokenAddress);

  const [owner, addr1, addr2] = await hre.ethers.getSigners();

  console.log("Owner address:", owner.address);
  console.log("Address 1:", addr1.address);
  console.log("Address 2:", addr2.address);

  // Транзакция 1: Transfer
  console.log("\n=== Transaction 1: Transfer 1000 MTK to Address 1 ===");
  const tx1 = await token.transfer(addr1.address, hre.ethers.parseEther("1000"));
  await tx1.wait();
  console.log("Transaction hash:", tx1.hash);
  console.log("Balance of Address 1:", hre.ethers.formatEther(await token.balanceOf(addr1.address)), "MTK");

  // Транзакция 2: Approve
  console.log("\n=== Transaction 2: Approve Address 2 to spend 500 MTK ===");
  const tx2 = await token.connect(addr1).approve(addr2.address, hre.ethers.parseEther("500"));
  await tx2.wait();
  console.log("Transaction hash:", tx2.hash);
  console.log("Allowance for Address 2:", hre.ethers.formatEther(await token.allowance(addr1.address, addr2.address)), "MTK");

  // Транзакция 3: TransferFrom
  console.log("\n=== Transaction 3: Address 2 transfers 300 MTK from Address 1 ===");
  const tx3 = await token.connect(addr2).transferFrom(addr1.address, addr2.address, hre.ethers.parseEther("300"));
  await tx3.wait();
  console.log("Transaction hash:", tx3.hash);
  console.log("Balance of Address 2:", hre.ethers.formatEther(await token.balanceOf(addr2.address)), "MTK");

  // Транзакция 4: Mint
  console.log("\n=== Transaction 4: Mint 5000 MTK to Owner ===");
  const tx4 = await token.mint(owner.address, hre.ethers.parseEther("5000"));
  await tx4.wait();
  console.log("Transaction hash:", tx4.hash);
  console.log("Balance of Owner:", hre.ethers.formatEther(await token.balanceOf(owner.address)), "MTK");

  // Транзакция 5: Another Transfer
  console.log("\n=== Transaction 5: Transfer 2000 MTK to Address 2 ===");
  const tx5 = await token.transfer(addr2.address, hre.ethers.parseEther("2000"));
  await tx5.wait();
  console.log("Transaction hash:", tx5.hash);
  console.log("Final balance of Address 2:", hre.ethers.formatEther(await token.balanceOf(addr2.address)), "MTK");

  console.log("\n=== Final Balances ===");
  console.log("Owner:", hre.ethers.formatEther(await token.balanceOf(owner.address)), "MTK");
  console.log("Address 1:", hre.ethers.formatEther(await token.balanceOf(addr1.address)), "MTK");
  console.log("Address 2:", hre.ethers.formatEther(await token.balanceOf(addr2.address)), "MTK");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });