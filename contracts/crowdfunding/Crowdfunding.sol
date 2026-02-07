// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Crowdfunding is Ownable, ReentrancyGuard {
    IERC20 public token;
    uint256 public goal;
    uint256 public deadline;
    uint256 public totalRaised;
    bool public fundsWithdrawn;

    mapping(address => uint256) public contributions;

    event Invested(address indexed investor, uint256 amount);
    event FundsWithdrawn(address indexed owner, uint256 amount);
    event Refunded(address indexed investor, uint256 amount);

    constructor(
        address tokenAddress,
        uint256 _goal,
        uint256 _durationInSeconds
    ) Ownable(msg.sender) {
        require(tokenAddress != address(0), "Invalid token address");
        require(_goal > 0, "Goal must be > 0");
        require(_durationInSeconds > 0, "Duration must be > 0");

        token = IERC20(tokenAddress);
        goal = _goal;
        deadline = block.timestamp + _durationInSeconds;
        fundsWithdrawn = false;
    }
    function invest (uint256 amount) external nonReentrant {
        require(block.timestamp <= deadline, "Crowdfunding ended");
        require(amount > 0, "Amount must be > 0");

        bool success = token.transferFrom(msg.sender, address(this), amount);
        require(success, "Token transfer failed");

        contributions[msg.sender] += amount;
        totalRaised += amount;

        emit Invested(msg.sender, amount);
    }
    function withdrawFunds() external onlyOwner nonReentrant {
        require(block.timestamp > deadline, "Crowdfundingnot ended yet");
        require(totalRaised >= goal, "Goal not reached");
        require(!fundsWithdrawn, "Funds already withdrawn");

        fundsWithdrawn = true;
        uint256 amount = totalRaised;

        bool success = token.transfer(owner(), amount);
        require(success, "Token transfer failed");

        emit FundsWithdrawn(owner(), amount);
    }
    function refund() external nonReentrant{
        require(block.timestamp > deadline, "Crowdfunding not ended yet");
        require(totalRaised < goal, "Goal reached, no refund");

        uint256 contributed = contributions[msg.sender];
        require(contributed > 0, "No contribution to refund");

        contributions[msg.sender] = 0;

        bool success = token.transfer(msg.sender, contributed);
        require(success, "Refund transfer failed");

        emit Refunded(msg.sender, contributed);
    }
    function timeLeft() external view returns (uint256) {
        if (block.timestamp >= deadline) return 0;
        return deadline - block.timestamp; 
    }
    function goalReached() external view returns (bool) {
        return totalRaised >= goal;
    }
}
