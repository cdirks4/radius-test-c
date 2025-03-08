const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function deployToken(name, symbol, initialSupply) {
  try {
    // Load configuration
    const config = JSON.parse(
      fs.readFileSync(path.join(__dirname, "config.json"))
    );
    console.log("Configuration loaded successfully");

    // Connect to the network
    const provider = new ethers.JsonRpcProvider(config.network.rpcUrl);
    const wallet = new ethers.Wallet(config.privateKey, provider);
    console.log("Deploying from address:", wallet.address);

    // Load the contract artifacts
    const artifactPath = path.join(
      __dirname,
      "../artifacts/contracts/test/ERC20.sol/ERC20.json"
    );
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    // Create contract factory
    const factory = new ethers.ContractFactory(
      artifact.abi,
      artifact.bytecode,
      wallet
    );

    console.log(`Deploying ${name} (${symbol}) token...`);
    const supply = ethers.parseEther(initialSupply.toString());

    // Create deployment transaction
    const deployTx = {
      type: 0,
      data:
        factory.bytecode + factory.interface.encodeDeploy([supply]).slice(2),
      gasLimit: ethers.toBigInt("3000000"),
      gasPrice: ethers.parseUnits("1", "gwei"),
      nonce: await provider.getTransactionCount(wallet.address),
      chainId: config.network.chainId,
      value: ethers.toBigInt("0"),
      to: null,
    };

    // Sign and send transaction
    const signedTx = await wallet.signTransaction(deployTx);
    const tx = await provider.broadcastTransaction(signedTx);
    console.log("Deployment transaction sent:", tx.hash);

    // Wait for deployment
    const receipt = await provider.waitForTransaction(tx.hash, 1, 120000);
    if (!receipt) {
      throw new Error("Transaction confirmation timeout");
    }

    const contractAddress = receipt.contractAddress;
    console.log("Token deployed to:", contractAddress);

    // Save to config
    const tokenConfig = {
      address: contractAddress,
      name,
      symbol,
      initialSupply: initialSupply.toString(),
    };

    // Update config with new token
    if (!config.tokens) {
      config.tokens = [];
    }
    config.tokens.push(tokenConfig);

    fs.writeFileSync(
      path.join(__dirname, "config.json"),
      JSON.stringify(config, null, 2)
    );

    return contractAddress;
  } catch (error) {
    console.error("Token deployment failed:", error);
    throw error;
  }
}

// Example usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const name = args[0] || "Test Token";
  const symbol = args[1] || "TEST";
  const initialSupply = args[2] || "1000000";

  deployToken(name, symbol, initialSupply)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

module.exports = { deployToken };
