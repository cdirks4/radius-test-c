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

    // Connect to the network
    const provider = new ethers.JsonRpcProvider(config.network.rpcUrl);
    const wallet = new ethers.Wallet(config.privateKey, provider);
    console.log("Deploying from address:", wallet.address);

    // Load the contract artifacts
    const artifactPath = path.join(
      __dirname,
      "../artifacts/contracts/ProductFactory.sol/ProductFactory.json"
    );
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    // Create contract factory
    const factory = new ethers.ContractFactory(
      artifact.abi,
      artifact.bytecode,
      wallet
    );

    // Deploy contract
    const deployTx = {
      type: 0,
      data: factory.bytecode + factory.interface.encodeDeploy([]).slice(2),
      gasLimit: ethers.toBigInt("5000000"),
      gasPrice: ethers.parseUnits("1", "gwei"),
      nonce: await provider.getTransactionCount(wallet.address),
      chainId: config.network.chainId,
      value: ethers.toBigInt("0"),
      to: null,
    };

    console.log("Signing deployment transaction...");
    const signedTx = await wallet.signTransaction(deployTx);

    console.log("Broadcasting deployment...");
    const tx = await provider.broadcastTransaction(signedTx);
    console.log("Deployment transaction sent:", tx.hash);

    const receipt = await provider.waitForTransaction(tx.hash, 1, 120000);
    if (!receipt) {
      throw new Error("Deployment timeout");
    }

    const contractAddress = receipt.contractAddress;
    console.log("ProductFactory deployed to:", contractAddress);

    // Update config with factory address
    config.productFactory = contractAddress;
    fs.writeFileSync(
      path.join(__dirname, "config.json"),
      JSON.stringify(config, null, 2)
    );
    console.log("Config updated with factory address");
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

main();
