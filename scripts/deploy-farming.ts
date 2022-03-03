import { ethers } from "hardhat";

async function main() {
  if (!process.env.ERC20_ADDRESS || !process.env.LP_ADDRESS) {
    throw new Error('ERC20_ADDRESS or LP_ADDRESS is not provided');
}
  const Farming = await ethers.getContractFactory("Farming");
  const farming = await Farming.deploy(process.env.ERC20_ADDRESS, process.env.LP_ADDRESS);

  await farming.deployed();

  console.log("Farming deployed to:", farming.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
