// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./YieldGeniusVault.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

// Yieldgenius Finance Vault V7 Proxy Factory
// Minimal proxy pattern for creating new Yieldgenius vaults
contract YieldGeniusVaultFactory {
    using Clones for address;

    // Contract template for deploying proxied Yieldgenius vaults
    YieldGeniusVault public instance;

    event ProxyCreated(address proxy);

    // Initializes the Factory with an instance of the Yieldgenius Vault V7
    constructor(address _instance) {
        if (_instance == address(0)) {
            instance = new YieldGeniusVault();
        } else {
            instance = YieldGeniusVault(_instance);
        }
    }

    // Creates a new Yieldgenius Vault V7 as a proxy of the template instance
    // A reference to the new proxied Yieldgenius Vault V7
    function cloneVault() external returns (YieldGeniusVault) {
        return YieldGeniusVault(cloneContract(address(instance)));
    }

    // Deploys and returns the address of a clone that mimics the behaviour of `implementation`
    function cloneContract(address implementation) public returns (address) {
        address proxy = implementation.clone();
        emit ProxyCreated(proxy);
        return proxy;
    }
}
