//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "./IERC20.sol";
import "./ERC20.sol";

contract Farming {
    uint8 public rewardPercent = 20;
    uint16 public minimumTime = 600; // Value in seconds
    ERC20 public farmingToken;
    ERC20 public lPToken;
    address private owner;

    struct Farm {
        uint amount;
        uint timeStart;
        uint rewardsClaimed;
    }

    mapping(address => Farm) public farmers;

    event Rewarded(address indexed to, uint amount);

    constructor(ERC20 _farmingToken, ERC20 _lPToken) {
        farmingToken = _farmingToken;
        lPToken = _lPToken;
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(owner == msg.sender, "You're not the owner");
        _;
    }

    function changeRewardPercent(uint8 percent) external onlyOwner {
        rewardPercent = percent;
    }

    function changeMinimumTime(uint16 time) external onlyOwner {
        minimumTime = time;
    }

    function stake(uint amount) external {
        address sender = msg.sender;
        Farm storage farm = farmers[sender];
        require(amount > 0, "Provide more than zero");
        require(farm.amount == 0, "Unstake balances first");

        bool success = lPToken.transferFrom(sender, address(this), amount);
        require(success, "transferFrom failed");

        farm.amount = amount;
        farm.timeStart = block.timestamp;
        farm.rewardsClaimed = 0;
    }

    function claim() external {
        Farm storage farm = farmers[msg.sender];
        uint timeOffset = block.timestamp - farm.timeStart;
        require(farm.amount > 0, "Nothing staked");
        require(timeOffset >= minimumTime || timeOffset / minimumTime > farm.rewardsClaimed, "No rewards yet");
        calculatePendingRewardsAndSend(farm);
    }

    function calculatePendingRewardsAndSend(Farm storage farm) private {
        uint pendingRewards = block.timestamp - farm.timeStart / minimumTime - farm.rewardsClaimed;

        if (pendingRewards > 0) {
            farm.rewardsClaimed += pendingRewards;
            uint reward = farm.amount / 100 * rewardPercent * pendingRewards;
            bool success = farmingToken.mint(reward, msg.sender);
            require(success, "mint failed");
            emit Rewarded(msg.sender, reward);
        }
    }

    function unstake() external {
        address sender = msg.sender;
        Farm storage farm = farmers[sender];
        require(farm.amount > 0, "Nothing staked");
        require(block.timestamp - farm.timeStart >= minimumTime, "Can't unstake yet");
        
        calculatePendingRewardsAndSend(farm);

        farm.amount = 0;
        bool success = lPToken.transfer(sender, farm.amount);
        require(success, "transfer failed");
    }
}
