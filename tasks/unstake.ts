import { task } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";

task('liquidity', 'Set approval to spend your tokens')
    .setAction(async ({ }, { ethers }) => {
        if (!process.env.FARMING_ADDRESS) {
            throw new Error('process.env.FARMING_ADDRESS is not provided');
        }

        const farming = await ethers.getContractAt(
            "Farming",
            process.env.FARMING_ADDRESS
        );

        const tx = await farming.unstake();
        await tx.wait();
    });