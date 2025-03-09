const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const FACTORY_ABI = [
  "function getProductCount() external view returns (uint256)",
  "function getAllProducts() external view returns (address[])",
  "function isValidProduct(address) external view returns (bool)",
];

async function listProducts() {
  try {
    // Load configuration
    const config = JSON.parse(
      fs.readFileSync(path.join(__dirname, "config.json"))
    );

    if (!config.productFactory) {
      throw new Error("ProductFactory address not found in config");
    }

    console.log("\n🏭 Product Factory:", config.productFactory);

    // Connect to network
    const provider = new ethers.JsonRpcProvider(config.network.rpcUrl);
    const wallet = new ethers.Wallet(config.privateKey, provider);

    // Create factory contract instance
    const factory = new ethers.Contract(
      config.productFactory,
      FACTORY_ABI,
      wallet
    );

    // Get all products
    const products = await factory.getAllProducts();
    const count = await factory.getProductCount();

    console.log("\n📦 Total Products:", count.toString());
    console.log("\n📋 Product List:");
    console.log("----------------");

    for (let i = 0; i < products.length; i++) {
      const isValid = await factory.isValidProduct(products[i]);
      console.log(`${i + 1}. Address: ${products[i]}`);
      console.log(`   Valid: ${isValid ? "✅" : "❌"}`);
      console.log("----------------");
    }
  } catch (error) {
    console.error("Error listing products:", error);
    process.exit(1);
  }
}

listProducts();
