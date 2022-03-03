import { task } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";

task('stake', 'stake approved LP tokens')
    .addParam('amount', 'amount of LP tokens')
    .setAction(async ({ amount }, { ethers }) => {
        if (!process.env.FARMING_ADDRESS) {
            throw new Error('process.env.FARMING_ADDRESS is not provided');
        }

        const farming = await ethers.getContractAt(
            "Farming",
            process.env.FARMING_ADDRESS
        );

        const tx = await farming.stake(amount);
        await tx.wait();
    });