import { task } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";

task('liquidity', 'Set approval to spend your tokens')
    .addParam('spender', 'Address of user to approve')
    .addParam('amount', 'amount of tokens')
    .setAction(async ({ spender, amount }, { ethers }) => {
        if (!process.env.ERC20_ADDRESS) {
            throw new Error('process.env.ERC20_ADDRESS is not provided');
        }

        const erc20 = await ethers.getContractAt(
            "ERC20",
            process.env.ERC20_ADDRESS
        );

        const tx = await erc20.approve(spender, amount);
        await tx.wait();
    });