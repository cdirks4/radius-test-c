// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ProductBreakdown.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ProductFactory is Ownable {
    // Array to store all deployed ProductBreakdown contracts
    address[] public products;

    // Mapping from product address to bool to track if it's a valid product
    mapping(address => bool) public isValidProduct;

    // Event emitted when a new product is created
    event ProductCreated(
        address indexed productAddress,
        address indexed creator
    );

    constructor() {}

    // Function to create a new ProductBreakdown contract
    function createProduct() external onlyOwner returns (address) {
        ProductBreakdown newProduct = new ProductBreakdown();
        address productAddress = address(newProduct);

        // Transfer ownership to the factory owner
        newProduct.transferOwnership(msg.sender);

        // Add to tracking
        products.push(productAddress);
        isValidProduct[productAddress] = true;

        emit ProductCreated(productAddress, msg.sender);
        return productAddress;
    }

    // Get the total number of products
    function getProductCount() external view returns (uint256) {
        return products.length;
    }

    // Get product at specific index
    function getProductAtIndex(uint256 index) external view returns (address) {
        require(index < products.length, "Index out of bounds");
        return products[index];
    }

    // Get all products
    function getAllProducts() external view returns (address[] memory) {
        return products;
    }
}
