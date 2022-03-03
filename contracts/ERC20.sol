//SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./IERC20.sol";

contract ERC20 is IERC20, AccessControl {
    bytes32 public constant MINTER = keccak256("MINTER");

    string public name;
    string public symbol;
    uint public totalSupply;
    uint8 public immutable decimals;

    mapping(address => uint) public balanceOf;
    mapping(address => mapping(address => uint)) public allowance;

    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        grantRole(MINTER, msg.sender);
    }

    function transfer(address recipient, uint amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Not enough balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[recipient] += amount;
        emit Transfer(msg.sender, recipient, amount);
        return true;
    }

    function approve(address spender, uint amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function increaseAllowance(address spender, uint amount) external returns (bool) {
        allowance[msg.sender][spender] += amount;
        emit Approval(msg.sender, spender, allowance[msg.sender][spender]);
        return true;
    }

    function decreaseAllowance(address spender, uint amount) external returns (bool) {
        allowance[msg.sender][spender] -= amount;
        emit Approval(msg.sender, spender, allowance[msg.sender][spender]);
        return true;
    }

    function transferFrom(
        address sender,
        address recipient,
        uint amount
    ) external returns (bool) {
        require(allowance[sender][msg.sender] >= amount, "Requested more than allowed");
        require(balanceOf[sender] >= amount, "Not enough balance");

        balanceOf[sender] -= amount;
        allowance[sender][msg.sender] -= amount;
        balanceOf[recipient] += amount;

        emit Transfer(msg.sender, recipient, amount);

        return true;
    }

    function mint(uint amount, address to) external onlyRole(MINTER) returns (bool) {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
        return true;
    }

    function burn(uint amount, address from) external onlyRole(MINTER) returns (bool) {
        balanceOf[from] -= amount;
        emit Transfer(from, address(0), amount);
        return true;
    }
}
