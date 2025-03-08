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

    // Create wallet from private key
    const wallet = new ethers.Wallet(config.privateKey, provider);
    console.log("Deploying from address:", wallet.address);

    // Get the balance
    const balance = await provider.getBalance(wallet.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");

    // Load the UniswapV2Factory artifacts
    const factoryArtifactPath = path.join(
      __dirname,
      "../artifacts/contracts/UniswapV2Factory.sol/UniswapV2Factory.json"
    );
    console.log("Loading factory artifacts from:", factoryArtifactPath);
    const factoryArtifact = JSON.parse(
      fs.readFileSync(factoryArtifactPath, "utf8")
    );
    console.log("Factory artifacts loaded successfully");

    // Deploy Factory
    console.log("Deploying UniswapV2Factory...");
    const Factory = new ethers.ContractFactory(
      factoryArtifact.abi,
      factoryArtifact.bytecode,
      wallet
    );

    // Create deployment transaction
    const deployTx = {
      type: 0,
      data:
        Factory.bytecode +
        Factory.interface.encodeDeploy([wallet.address]).slice(2),
      gasLimit: ethers.toBigInt("5000000"),
      gasPrice: ethers.parseUnits("1", "gwei"),
      nonce: await provider.getTransactionCount(wallet.address),
      chainId: config.network.chainId,
      value: ethers.toBigInt("0"),
      to: null,
    };

    console.log("Signing factory deployment transaction...");
    const signedTx = await wallet.signTransaction(deployTx);

    console.log("Broadcasting factory deployment...");
    const tx = await provider.broadcastTransaction(signedTx);
    console.log("Factory deployment transaction sent:", tx.hash);

    const receipt = await provider.waitForTransaction(tx.hash, 1, 120000);
    if (!receipt) {
      throw new Error("Factory deployment timeout");
    }

    const factoryAddress = receipt.contractAddress;
    console.log("Factory deployed to:", factoryAddress);

    // Create factory contract instance
    const factory = new ethers.Contract(
      factoryAddress,
      factoryArtifact.abi,
      wallet
    );

    // Create pair
    console.log("Creating pair for tokens:", {
      tokenA: config.tokenA,
      tokenB: config.tokenB,
    });

    const createPairTx = {
      to: factoryAddress,
      data: factory.interface.encodeFunctionData("createPair", [
        config.tokenA,
        config.tokenB,
      ]),
      gasLimit: ethers.toBigInt("3000000"),
      gasPrice: ethers.parseUnits("1", "gwei"),
      nonce: await provider.getTransactionCount(wallet.address),
      chainId: config.network.chainId,
      value: ethers.toBigInt("0"),
    };

    // Sign and send the createPair transaction
    console.log("Signing create pair transaction...");
    const signedCreatePairTx = await wallet.signTransaction(createPairTx);

    console.log("Broadcasting create pair transaction...");
    const createPairTxResponse = await provider.broadcastTransaction(
      signedCreatePairTx
    );
    console.log("Create pair transaction sent:", createPairTxResponse.hash);

    // Wait for pair creation confirmation
    console.log("Waiting for pair creation confirmation...");
    const createPairReceipt = await provider.waitForTransaction(
      createPairTxResponse.hash,
      1,
      120000
    );
    if (!createPairReceipt) {
      throw new Error("Pair creation timeout");
    }

    // Get pair address using a direct contract call
    const pairAddress = await factory.getPair(config.tokenA, config.tokenB);
    console.log("Pair address:", pairAddress);

    // Update config
    config.uniswap = {
      factory: factoryAddress,
      pair: pairAddress,
    };

    fs.writeFileSync(
      path.join(__dirname, "config.json"),
      JSON.stringify(config, null, 2)
    );
    console.log("Config updated with Uniswap addresses");
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
