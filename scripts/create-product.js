const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const FACTORY_ABI = [
  "function createProduct() external returns (address)",
  "event ProductCreated(address indexed productAddress, address indexed creator)",
];

async function createProduct() {
  try {
    // Load configuration
    const config = JSON.parse(
      fs.readFileSync(path.join(__dirname, "config.json"))
    );
    console.log("Configuration loaded successfully");
    console.log("Network RPC URL:", config.network.rpcUrl);
    console.log("Chain ID:", config.network.chainId);

    if (!config.productFactory) {
      throw new Error("ProductFactory address not found in config");
    }

    // Connect to network
    const provider = new ethers.JsonRpcProvider(config.network.rpcUrl);
    console.log("Connected to network provider");

    // Get network details
    try {
      const network = await provider.getNetwork();
      console.log("Network details:", {
        chainId: network.chainId,
        name: network.name,
      });
    } catch (error) {
      console.warn("Warning: Could not fetch network details:", error.message);
    }

    // Create wallet and check balance
    const wallet = new ethers.Wallet(config.privateKey, provider);
    console.log("Using address:", wallet.address);

    const balance = await provider.getBalance(wallet.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");

    // Create factory contract instance
    const factory = new ethers.Contract(
      config.productFactory,
      FACTORY_ABI,
      wallet
    );

    console.log("\n🏭 Creating new product...");

    // Use minimal transaction parameters
    const tx = await factory.createProduct({
      gasLimit: 300000
    });

    console.log("Transaction sent:", tx.hash);

    const receipt = await tx.wait();

    // Find the ProductCreated event
    const event = receipt.logs.find(
      (log) => log.fragment && log.fragment.name === "ProductCreated"
    );

    if (event) {
      const [productAddress, creator] = event.args;
      console.log("\n✅ Product created successfully!");
      console.log("📍 Product address:", productAddress);
      console.log("👤 Creator:", creator);
    }
  } catch (error) {
    console.error("Error creating product:", error);
    if (error.transaction) {
      console.error("Transaction details:", {
        from: error.transaction.from,
        to: error.transaction.to,
        data: error.transaction.data?.slice(0, 100) + "...",
        gasLimit: error.transaction.gasLimit?.toString(),
      });
    }
    process.exit(1);
  }
}

createProduct();
