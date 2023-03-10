// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract YieldGeniusToken is ERC20Burnable, ERC20Permit, Ownable {
    using SafeERC20 for IERC20;

    mapping(address => bool) public minters;

    uint256 internal constant MAX_TOTAL_SUPPLY = 100000000 ether;

    constructor() ERC20("Yield Genius Token", "YG") ERC20Permit("YG") {}

    function mint(address to, uint256 amount) external {
        require(minters[msg.sender], "not a minter");
        require(amount + totalSupply() <= MAX_TOTAL_SUPPLY, "max reached");
        _mint(to, amount);
    }

    function setMinter(address _minter) external onlyOwner {
        minters[_minter] = true;
    }

    function removeMinter(address _minter) external onlyOwner {
        minters[_minter] = false;
    }
}
