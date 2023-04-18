// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.7.5;
pragma abicoder v2;

interface IUniproxy {
    function getSqrtTwapX96(
        address pos,
        uint32 _twapInterval
    ) external view returns (uint160 sqrtPriceX96);

    function deposit(
        uint256 deposit0,
        uint256 deposit1,
        address to,
        address pos,
        uint256[] memory minIn
    ) external returns (uint256 shares);
}
