import { expect } from "chai";
import { network, ethers } from "hardhat";
import { ERC20, Farming__factory } from "../typechain";

import RouterArtifact from "@uniswap/v2-periphery/build/UniswapV2Router02.json";
import FactoryArtifact from "@uniswap/v2-periphery/build/IUniswapV2Factory.json";
import PairArtifact from "@uniswap/v2-periphery/build/IUniswapV2Pair.json";

describe('Uniswap LP tokens tests', () => {
    const farmingTokenDecimals = 8;
    const lpTokenDecimals = 18;
    const farmingTokensSupply = addDecimals(1000, farmingTokenDecimals);
    const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

    const minterRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('MINTER'));

    it("Should connect to uniswap and stake coins", async function () {
        const [owner, user1, user2] = await ethers.getSigners();

        const farmingToken: ERC20 = await (await ethers.getContractFactory("ERC20")).deploy("AIR", "AIR", farmingTokenDecimals);
        await farmingToken.deployed();

        const router = new ethers.Contract(routerAddress, RouterArtifact.abi, owner);
        
        const factory = new ethers.Contract(await router.factory(), FactoryArtifact.abi, owner);

        await farmingToken.mint(farmingTokensSupply, owner.address);
        await farmingToken.approve(routerAddress, farmingTokensSupply);
        
        const deadline = Math.floor(new Date().getTime() / 1000) + 24 * 3600;
        const options = {value: ethers.utils.parseEther("1.0")}
        const addLiqTx = await router.addLiquidityETH(
            farmingToken.address,
            farmingTokensSupply,
            addDecimals(990, farmingTokenDecimals),
            ethers.utils.parseEther("0.99"),
            owner.address,
            deadline,
            options
        );

        const pairAddress = await factory.getPair(farmingToken.address, await router.WETH());
        console.log(pairAddress);

        const pair = new ethers.Contract(pairAddress, PairArtifact.abi, owner);

        const Farming: Farming__factory = await ethers.getContractFactory("Farming");
        const farming = await Farming.deploy(farmingToken.address, pair.address);
        await farming.deployed();
        farmingToken.grantRole(minterRole, farming.address);

        const lpBalance = await pair.balanceOf(owner.address);
        
        await pair.approve(farming.address, addDecimals(100, lpTokenDecimals));
        await farming.stake(lpBalance);

        await network.provider.send("evm_increaseTime", [600]);
        await network.provider.send("evm_mine");

        await farming.claim();
        const reward = await farmingToken.balanceOf(owner.address);
        console.log(reward);
        await farming.unstake();

        expect(await farmingToken.balanceOf(owner.address)).to.be.equal(reward);
        expect(await pair.balanceOf(owner.address)).to.be.equal(lpBalance);
    });

    function addDecimals(num: number, decimals: number) {
        return ethers.utils.parseUnits(num.toString(), decimals);
    }
});