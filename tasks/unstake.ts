import { task } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";

task('unstake', 'Unstake LP tokens')
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