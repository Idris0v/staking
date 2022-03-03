import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { ERC20, ERC20__factory, Farming, Farming__factory } from "../typechain";

describe("ERC20", function () {
    let farming: Farming;
    let farmingToken: ERC20;
    const farmingTokenDecimals = 8;
    const _10farmingTokens = ethers.utils.parseUnits('10', farmingTokenDecimals);
    let lpToken: ERC20;
    const lpTokenDecimals = 18;
    const _10lpTokens = ethers.utils.parseUnits('10', lpTokenDecimals);
    let owner: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let minterRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('MINTER'));

    beforeEach(async () => {
        [owner, user1, user2] = await ethers.getSigners();

        const FarmingToken: ERC20__factory = await ethers.getContractFactory("ERC20");
        farmingToken = await FarmingToken.deploy("AIR", "AIR", farmingTokenDecimals);
        await farmingToken.deployed();

        const LPToken: ERC20__factory = await ethers.getContractFactory("ERC20");
        lpToken = await LPToken.deploy("UNI", "UNI", lpTokenDecimals);
        await lpToken.deployed();

        const Farming: Farming__factory = await ethers.getContractFactory("Farming");
        farming = await Farming.deploy(farmingToken.address, lpToken.address);
        await farming.deployed();

        farmingToken.grantRole(minterRole, farming.address);
    });

    it("Should create contract correctly", async function () {
        expect(await farming.farmingToken()).to.equal(farmingToken.address);
        expect(await farming.lPToken()).to.equal(lpToken.address);
    });

    it("Should change reward percent", async function () {
        await farming.changeRewardPercent(30);
        expect(await farming.rewardPercent()).to.equal(ethers.BigNumber.from(30));
    });

    it("Should forbid to change reward percent when not admin", async function () {
        expect(farming.connect(user1).changeRewardPercent(30)).to.be.revertedWith("You're not the owner");
    });

    it("Should change minimum time", async function () {
        await farming.changeMinimumTime(3600);
        expect(await farming.minimumTime()).to.equal(ethers.BigNumber.from(3600));
    });

    it("Should forbid to change minimum time when not admin", async function () {
        expect(farming.connect(user1).changeMinimumTime(3600)).to.be.revertedWith("You're not the owner");
    });

    describe('stake method', () => {
        it("Should stake LP tokens", async function () {
            await lpToken.mint(_10lpTokens, user1.address);
            await lpToken.connect(user1).approve(farming.address, _10lpTokens);
            await farming.connect(user1).stake(_10lpTokens);
            const result = await farming.farmers(user1.address);

            expect(result.amount).to.equal(ethers.BigNumber.from(_10lpTokens));
            //   expect(result.timeStart).to.be.greaterThan(0);
            expect(result.rewardsClaimed).to.equal(0);
        });

        it("Should revert when already has stake", async function () {
            lpToken.mint(_10lpTokens, user1.address);
            await lpToken.connect(user1).approve(farming.address, _10lpTokens);
            await farming.connect(user1).stake(addDecimals(5, lpTokenDecimals));
            expect(farming.connect(user1).stake(5)).to.be.revertedWith("Unstake balances first");
        });

        it("Should revert when provided 0 stake", async function () {
            expect(farming.connect(user1).stake(0)).to.be.revertedWith("Provide more than zero");
        });
    });

    describe('claim method', () => {
        it("Should claim reward", async function () {
            await lpToken.mint(_10lpTokens, user1.address);
            await lpToken.connect(user1).approve(farming.address, _10lpTokens);
            await farming.connect(user1).stake(_10lpTokens);

            await network.provider.send("evm_increaseTime", [600]);
            await network.provider.send("evm_mine");

            await farming.connect(user1).claim();
            expect(farmingToken.balanceOf(user1.address)).to.be.equal(addDecimals(2, farmingTokenDecimals));
        });

        it("Should revert claim when no rewards", async function () {
            await lpToken.mint(_10lpTokens, user1.address);
            await lpToken.connect(user1).approve(farming.address, _10lpTokens);
            await farming.connect(user1).stake(_10lpTokens);

            expect(farming.connect(user1).claim()).to.be.revertedWith("No rewards yet");
        });

        it("Should revert claim when nothing staked", async function () {
            expect(farming.claim()).to.be.revertedWith("Nothing staked");
        });
    });

    describe('unstake method', () => {
        it("Should unstake and receive reward", async function () {
            await lpToken.mint(_10lpTokens, user1.address);
            await lpToken.connect(user1).approve(farming.address, _10lpTokens);
            await farming.connect(user1).stake(_10lpTokens);

            await network.provider.send("evm_increaseTime", ['0x258']);
            await network.provider.send("evm_mine");

            await farming.connect(user1).unstake();

            expect(await farmingToken.balanceOf(user1.address)).to.be.equal(addDecimals(2, farmingTokenDecimals));
            expect(await lpToken.balanceOf(user1.address)).to.be.equal(_10lpTokens);
        });

        it("Should forbid to unstake when minimum time has not passed", async function () {
            await lpToken.mint(_10lpTokens, user1.address);
            await lpToken.connect(user1).approve(farming.address, _10lpTokens);
            await farming.connect(user1).stake(_10lpTokens);

            expect(farming.connect(user1).unstake()).to.be.revertedWith("Can't unstake yet");
        });

        it("Should revert unstake when nothing staked", async function () {
            expect(farming.unstake()).to.be.revertedWith("Nothing staked");
        });
    });

    function addDecimals(num: number, decimals: number) {
        return ethers.utils.parseUnits(num.toString(), decimals);
    }
});
