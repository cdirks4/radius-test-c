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
      "../artifacts/contracts/ProductBreakdown.sol/ProductBreakdown.json"
    );
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    // Create contract factory
    const factory = new ethers.ContractFactory(
      artifact.abi,
      artifact.bytecode,
      wallet
    );

    // Deploy contract with payment token address
    const deployTx = {
      type: 0,
      data: factory.bytecode + 
            factory.interface.encodeDeploy([config.tokenA]).slice(2),
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
    console.log("ProductBreakdown deployed to:", contractAddress);

    // Create contract instance
    const contract = new ethers.Contract(contractAddress, artifact.abi, wallet);

    // Add 10 stakeholders
    const stakeholders = [
      { role: "Farmer", percentage: 1500 },      // 15%
      { role: "Processor", percentage: 1000 },    // 10%
      { role: "Roaster", percentage: 1500 },      // 15%
      { role: "Distributor", percentage: 1000 },  // 10%
      { role: "Retailer", percentage: 1500 },     // 15%
      { role: "Marketing", percentage: 1000 },    // 10%
      { role: "Quality Control", percentage: 800 }, // 8%
      { role: "Logistics", percentage: 700 },     // 7%
      { role: "Management", percentage: 500 },    // 5%
      { role: "Support", percentage: 500 }        // 5%
    ];

    console.log("Adding stakeholders...");
    for (const stakeholder of stakeholders) {
      const addTx = {
        to: contractAddress,
        data: contract.interface.encodeFunctionData("addStakeholder", [
          wallet.address, // Using deployer address for demo
          stakeholder.percentage,
          stakeholder.role
        ]),
        gasLimit: ethers.toBigInt("200000"),
        gasPrice: ethers.parseUnits("1", "gwei"),
        nonce: await provider.getTransactionCount(wallet.address),
        chainId: config.network.chainId,
        value: ethers.toBigInt("0")
      };

      const signedAddTx = await wallet.signTransaction(addTx);
      const addTxResponse = await provider.broadcastTransaction(signedAddTx);
      await provider.waitForTransaction(addTxResponse.hash, 1, 120000);
      console.log(`Added ${stakeholder.role} with ${stakeholder.percentage/100}%`);
    }

    // Save contract address to config
    config.productBreakdown = {
      address: contractAddress,
      stakeholders: stakeholders
    };
    fs.writeFileSync(
      path.join(__dirname, "config.json"),
      JSON.stringify(config, null, 2)
    );
    console.log("Config updated with ProductBreakdown contract");

  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });