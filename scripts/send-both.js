const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function sendBoth(toAddress, ethAmount, tokenSymbol, tokenAmount) {
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
    console.log("\n👤 Sender Address:", wallet.address);

    const balance = await provider.getBalance(wallet.address);
    console.log("💰 Sender Balance:", ethers.formatEther(balance), "ETH");

    // First send ETH
    console.log(`\n💸 Sending ${ethAmount} ETH to ${toAddress}...`);

    const ethTx = {
      type: 0,
      to: toAddress,
      value: ethers.parseEther(ethAmount.toString()),
      gasLimit: ethers.toBigInt("21000"),
      gasPrice: ethers.parseUnits("1", "gwei"),
      nonce: await provider.getTransactionCount(wallet.address),
      chainId: config.network.chainId,
    };

    const signedEthTx = await wallet.signTransaction(ethTx);
    const ethTransaction = await provider.broadcastTransaction(signedEthTx);
    console.log("ETH Transaction sent:", ethTransaction.hash);
    console.log(
      "Base64 Hash:",
      Buffer.from(ethTransaction.hash.slice(2), "hex").toString("base64")
    );

    // Wait for ETH transaction
    const ethReceipt = await provider.waitForTransaction(
      ethTransaction.hash,
      1,
      120000
    );
    if (!ethReceipt) {
      throw new Error("ETH transaction confirmation timeout");
    }
    console.log("ETH transaction confirmed in block:", ethReceipt.blockNumber);

    // Now send the token
    const token = config.tokens.find((t) => t.symbol === tokenSymbol);
    if (!token) {
      throw new Error(`Token ${tokenSymbol} not found in config`);
    }

    const tokenContract = new ethers.Contract(
      token.address,
      [
        "function transfer(address to, uint256 amount) returns (bool)",
        "function balanceOf(address owner) view returns (uint256)",
        "function decimals() view returns (uint8)",
      ],
      wallet
    );

    const decimals = await tokenContract.decimals();
    const formattedAmount = ethers.parseUnits(tokenAmount.toString(), decimals);

    console.log(
      `\n🪙 Sending ${tokenAmount} ${tokenSymbol} to ${toAddress}...`
    );
    const data = tokenContract.interface.encodeFunctionData("transfer", [
      toAddress,
      formattedAmount,
    ]);

    const tokenTx = {
      type: 0,
      to: token.address,
      data: data,
      gasLimit: ethers.toBigInt("100000"),
      gasPrice: ethers.parseUnits("1", "gwei"),
      nonce: await provider.getTransactionCount(wallet.address),
      chainId: config.network.chainId,
      value: ethers.toBigInt("0"),
    };

    const signedTokenTx = await wallet.signTransaction(tokenTx);
    const tokenTransaction = await provider.broadcastTransaction(signedTokenTx);
    console.log("Token transaction sent:", tokenTransaction.hash);
    console.log(
      "Base64 Hash:",
      Buffer.from(tokenTransaction.hash.slice(2), "hex").toString("base64")
    );

    const tokenReceipt = await provider.waitForTransaction(
      tokenTransaction.hash,
      1,
      120000
    );
    if (!tokenReceipt) {
      throw new Error("Token transaction confirmation timeout");
    }
    console.log(
      "Token transaction confirmed in block:",
      tokenReceipt.blockNumber
    );

    return { ethReceipt, tokenReceipt };
  } catch (error) {
    console.error("\n❌ Transactions failed:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const toAddress = "0xF893987A63cc4e206567aA9931ce79990a28B4D6";
  const ethAmount = "0.01"; // Amount in ETH
  const tokenAmount = "100"; // Amount of tokens
  const tokenSymbol = "WFE";

  sendBoth(toAddress, ethAmount, tokenSymbol, tokenAmount)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

module.exports = { sendBoth };
