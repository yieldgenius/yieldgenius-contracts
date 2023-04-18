// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.7.5;
pragma abicoder v2;

interface IHyperVisor {
    function getTotalAmounts()
        external
        view
        returns (uint256 total0, uint256 total1);
}
