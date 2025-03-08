const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
];

async function listTokens() {
  try {
    // Load configuration
    const config = JSON.parse(
      fs.readFileSync(path.join(__dirname, "config.json"))
    );

    console.log("\n🌐 RPC URL:", config.network.rpcUrl);
    console.log("🔗 Chain ID:", config.network.chainId);

    // Connect to network
    const provider = new ethers.JsonRpcProvider(config.network.rpcUrl);
    const wallet = new ethers.Wallet(config.privateKey, provider);
    console.log("\n👤 Wallet Address:", wallet.address);

    // Get ETH balance
    const ethBalance = await provider.getBalance(wallet.address);
    console.log(
      "\n💰 Native Token Balance:",
      ethers.formatEther(ethBalance),
      "ETH"
    );

    // Check token balances
    console.log("\n🪙 ERC-20 Token Balances:");
    console.log("------------------------");

    if (!config.tokens || !Array.isArray(config.tokens)) {
      console.log("No tokens configured in config.json");
      return;
    }

    for (const token of config.tokens) {
      try {
        const tokenContract = new ethers.Contract(
          token.address,
          ERC20_ABI,
          provider
        );

        // Use the configured name and symbol instead of reading from contract
        const name = token.name;
        const symbol = token.symbol;

        const [balance, decimals] = await Promise.all([
          tokenContract.balanceOf(wallet.address),
          tokenContract.decimals(),
        ]);

        const formattedBalance = ethers.formatUnits(balance, decimals);
        console.log(`${name} (${symbol}):`);
        console.log(`Address: ${token.address}`);
        console.log(`Balance: ${formattedBalance}`);
        console.log("------------------------");
      } catch (error) {
        console.log(
          `Error checking token ${token.symbol || token.address}:`,
          error.message
        );
        console.log("------------------------");
      }
    }
  } catch (error) {
    console.error("\n❌ Error:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  listTokens()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

module.exports = { listTokens };
