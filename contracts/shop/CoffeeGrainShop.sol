// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CoffeeGrainShop is Ownable {
    IERC20 public paymentToken;

    uint256 public pricePerKg; 

    
    mapping(address => uint256) public purchasedKg;

    event GrainPurchased(
        address indexed buyer,
        uint256 kg,
        uint256 totalPaid
    );

    constructor(
        address tokenAddress,
        uint256 _pricePerKg
    ) Ownable(msg.sender) {
        paymentToken = IERC20(tokenAddress);
        pricePerKg = _pricePerKg;
    }

    function buyGrain(uint256 kg) external {
        require(kg > 0, "Kg must be > 0");

        uint256 totalCost = kg * pricePerKg;


        bool success = paymentToken.transferFrom(
            msg.sender,
            owner(),
            totalCost
        );

        require(success, "Token transfer failed");

        
        purchasedKg[msg.sender] += kg;

        emit GrainPurchased(msg.sender, kg, totalCost);
    }

    
    function setPricePerKg(uint256 newPrice) external onlyOwner {
        pricePerKg = newPrice;
    }
}
