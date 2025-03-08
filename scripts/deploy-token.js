const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {
  try {
    // Load configuration
    const config = JSON.parse(
      fs.readFileSync(path.join(__dirname, "config.json"))
    );
    console.log("Configuration loaded successfully");
    console.log("Network RPC URL:", config.network.rpcUrl);
    console.log("Chain ID:", config.network.chainId);

    // Connect to the network
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

    // Create wallet from private key
    const wallet = new ethers.Wallet(config.privateKey, provider);
    console.log("Deploying from address:", wallet.address);

    // Get the balance
    const balance = await provider.getBalance(wallet.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");

    // Load the contract artifacts
    const artifactPath = path.join(
      __dirname,
      "../artifacts/contracts/test/ERC20.sol/ERC20.json"
    );
    console.log("Loading contract artifacts from:", artifactPath);
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    console.log("Contract artifacts loaded successfully");

    // Create contract factory
    const factory = new ethers.ContractFactory(
      artifact.abi,
      artifact.bytecode,
      wallet
    );
    console.log("Contract factory created");

    console.log("Deploying ERC20 contract...");
    const initialSupply = ethers.parseEther("1000000"); // 1 million tokens
    console.log("Initial supply:", initialSupply.toString(), "wei");

    // Get current nonce
    const nonce = await provider.getTransactionCount(wallet.address);
    console.log("Current nonce:", nonce);

    // Create deployment transaction with fixed values
    console.log("Creating deployment transaction...");
    const deployTx = {
      type: 0, // Legacy transaction type
      data:
        factory.bytecode +
        factory.interface.encodeDeploy([initialSupply]).slice(2),
      gasLimit: ethers.toBigInt("3000000"),
      gasPrice: ethers.parseUnits("1", "gwei"),
      nonce: nonce,
      chainId: config.network.chainId,
      value: ethers.toBigInt("0"),
      to: null, // Contract creation
    };

    // Sign the transaction manually
    console.log("Signing transaction...");
    const signedTx = await wallet.signTransaction(deployTx);

    // Send raw transaction
    console.log("Sending raw transaction...");
    const tx = await provider.broadcastTransaction(signedTx);
    console.log("Deployment transaction sent:", tx.hash);

    // Wait for deployment with timeout
    console.log("Waiting for transaction confirmation...");
    const receipt = await provider.waitForTransaction(tx.hash, 1, 120000); // 2 minute timeout
    if (!receipt) {
      throw new Error("Transaction confirmation timeout");
    }

    const contractAddress = receipt.contractAddress;
    console.log("Contract deployed to:", contractAddress);

    // Create contract instance to check balance
    const erc20 = new ethers.Contract(contractAddress, artifact.abi, wallet);
    const tokenBalance = await erc20.balanceOf(wallet.address);
    console.log("Token balance:", ethers.formatEther(tokenBalance), "tokens");

    // Save the contract address to config
    config.contractAddress = contractAddress;
    fs.writeFileSync(
      path.join(__dirname, "config.json"),
      JSON.stringify(config, null, 2)
    );
    console.log("Contract address saved to config.json");
  } catch (error) {
    console.error("Deployment failed with error:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
