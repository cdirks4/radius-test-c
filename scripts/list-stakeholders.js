const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const PRODUCT_ABI = [
  "function getStakeholdersCount() external view returns (uint256)",
  "function getStakeholder(uint256 index) external view returns (address wallet, uint256 percentage, string role)",
  "function totalPercentage() external view returns (uint256)",
];

async function listStakeholders(productAddress) {
  try {
    // Load configuration
    const config = JSON.parse(
      fs.readFileSync(path.join(__dirname, "config.json"))
    );

    // Connect to network
    const provider = new ethers.JsonRpcProvider(config.network.rpcUrl);
    const wallet = new ethers.Wallet(config.privateKey, provider);

    // Create contract instance
    const product = new ethers.Contract(productAddress, PRODUCT_ABI, wallet);

    // Get stakeholders count
    const count = await product.getStakeholdersCount();
    const totalPercentage = await product.totalPercentage();

    console.log("\n📊 Product Stakeholders");
    console.log("📍 Product Address:", productAddress);
    console.log("👥 Total Stakeholders:", count.toString());
    console.log(
      "💯 Total Percentage:",
      (Number(totalPercentage) / 100).toString(),
      "%"
    );
    console.log("\n📋 Stakeholder List:");
    console.log("----------------");

    for (let i = 0; i < count; i++) {
      const [wallet, percentage, role] = await product.getStakeholder(i);
      console.log(`${i + 1}. Role: ${role}`);
      console.log(`   Wallet: ${wallet}`);
      console.log(`   Share: ${Number(percentage) / 100}%`);
      console.log("----------------");
    }
  } catch (error) {
    console.error("Error listing stakeholders:", error);
    process.exit(1);
  }
}

// Use the product address from your previous output
const productAddress = "0x08633B06c1250e80CDCD54314C4600661483C777";
listStakeholders(productAddress);
