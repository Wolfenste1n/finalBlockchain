// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Token
 * @notice A generic ERC20 token contract that can be deployed with any name and symbol
 * @dev Built with OpenZeppelin contracts - supports burning and owner-controlled minting
 */
contract Token is ERC20, ERC20Burnable, Ownable {
    /**
     * @notice Creates a new token with specified name, symbol, and initial supply
     * @param name The full name of the token (e.g., "MyToken")
     * @param symbol The symbol of the token (e.g., "MTK")
     * @param initialSupply The initial supply of tokens (will be multiplied by 10^18 for decimals)
     * @param initialOwner The address that will own the contract and receive initial tokens
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address initialOwner
    ) ERC20(name, symbol) Ownable(initialOwner) {
        if (initialSupply > 0) {
            uint256 amount = initialSupply * 10 ** decimals();
            _mint(initialOwner, amount);
        }
    }

    /**
     * @notice Allows the owner to create new tokens
     * @param to The address that will receive the newly minted tokens
     * @param amount The number of tokens to mint (in wei, so include 18 decimals)
     */
    function mint(address to, uint256 amount) public onlyOwner {
        require(to != address(0), "Token: cannot mint to zero address");
        _mint(to, amount);
    }
}