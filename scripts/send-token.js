const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

async function sendToken(tokenSymbol, toAddress, amount) {
  try {
    // Load configuration
    const config = JSON.parse(
      fs.readFileSync(path.join(__dirname, "config.json"))
    );

    console.log("\n🌐 RPC URL:", config.network.rpcUrl);
    console.log("🔗 Chain ID:", config.network.chainId);

    // Find token in config
    const token = config.tokens.find((t) => t.symbol === tokenSymbol);
    if (!token) {
      throw new Error(`Token ${tokenSymbol} not found in config`);
    }

    // Connect to network
    const provider = new ethers.JsonRpcProvider(config.network.rpcUrl);
    const wallet = new ethers.Wallet(config.privateKey, provider);
    console.log("Sending from:", wallet.address);

    // Create contract instance
    const tokenContract = new ethers.Contract(token.address, ERC20_ABI, wallet);

    // Get decimals and format amount
    const decimals = await tokenContract.decimals();
    const formattedAmount = ethers.parseUnits(amount.toString(), decimals);

    // Check balance
    const balance = await tokenContract.balanceOf(wallet.address);
    if (balance < formattedAmount) {
      throw new Error(`Insufficient ${token.symbol} balance`);
    }

    console.log(`Sending ${amount} ${token.symbol} to ${toAddress}...`);

    // Create transaction data
    const data = tokenContract.interface.encodeFunctionData("transfer", [
      toAddress,
      formattedAmount,
    ]);

    // Create transaction object
    const tx = {
      type: 0,
      to: token.address,
      data: data,
      gasLimit: ethers.toBigInt("100000"),
      gasPrice: ethers.parseUnits("1", "gwei"),
      nonce: await provider.getTransactionCount(wallet.address),
      chainId: config.network.chainId,
      value: ethers.toBigInt("0"),
    };

    // Sign and send transaction
    const signedTx = await wallet.signTransaction(tx);
    const transaction = await provider.broadcastTransaction(signedTx);
    console.log("Transaction sent:", transaction.hash);

    // After transaction is sent
    console.log("\n📝 Transaction Details:");
    console.log("Hash:", transaction.hash);
    console.log("Base64 Hash:", Buffer.from(transaction.hash.slice(2), 'hex').toString('base64'));
    
    // Wait for confirmation
    const receipt = await provider.waitForTransaction(transaction.hash, 1, 120000);
    if (!receipt) {
      throw new Error("Transaction confirmation timeout");
    }
    console.log("\n✅ Transaction confirmed in block:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());

    return receipt;
  } catch (error) {
    console.error("\n❌ Transfer failed:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const toAddress = "0x609a24E7DAB0e95764b1a35C37fa74CD0f5ffA84";
  const amount = "100"; // Amount of tokens to send
  const tokenSymbol = "WFE";

  sendToken(tokenSymbol, toAddress, amount)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

module.exports = { sendToken };
