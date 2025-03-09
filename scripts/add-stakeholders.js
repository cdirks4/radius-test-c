const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const PRODUCT_ABI = [
  "function addStakeholder(address payable _wallet, uint256 _percentage, string memory _role) external",
  "function owner() external view returns (address)"
];

async function addStakeholders(productAddress) {
  try {
    // Load configuration
    const config = JSON.parse(
      fs.readFileSync(path.join(__dirname, "config.json"))
    );

    // Connect to network
    const provider = new ethers.JsonRpcProvider(config.network.rpcUrl);
    const wallet = new ethers.Wallet(config.privateKey, provider);
    console.log("Using address:", wallet.address);

    // Create contract instance
    const product = new ethers.Contract(productAddress, PRODUCT_ABI, wallet);

    // Verify ownership
    const owner = await product.owner();
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
      throw new Error("Not the owner of the contract");
    }

    // Generate unique wallets for each stakeholder
    const stakeholderWallets = Array(10).fill(0).map(() => ethers.Wallet.createRandom());

    // Define stakeholders with unique wallets
    const stakeholders = [
      { role: "Farmer", percentage: 1500, wallet: stakeholderWallets[0] },
      { role: "Processor", percentage: 1000, wallet: stakeholderWallets[1] },
      { role: "Roaster", percentage: 1500, wallet: stakeholderWallets[2] },
      { role: "Distributor", percentage: 1000, wallet: stakeholderWallets[3] },
      { role: "Retailer", percentage: 1500, wallet: stakeholderWallets[4] },
      { role: "Marketing", percentage: 1000, wallet: stakeholderWallets[5] },
      { role: "Quality Control", percentage: 800, wallet: stakeholderWallets[6] },
      { role: "Logistics", percentage: 700, wallet: stakeholderWallets[7] },
      { role: "Management", percentage: 500, wallet: stakeholderWallets[8] },
      { role: "Support", percentage: 500, wallet: stakeholderWallets[9] }
    ];

    console.log("\nAdding stakeholders...");
    for (const stakeholder of stakeholders) {
      const addTx = {
        to: productAddress,
        data: product.interface.encodeFunctionData("addStakeholder", [
          stakeholder.wallet.address,
          stakeholder.percentage,
          stakeholder.role
        ]),
        gasLimit: ethers.toBigInt("200000"),
        gasPrice: ethers.parseUnits("1", "gwei"),
        nonce: await provider.getTransactionCount(wallet.address),
        chainId: config.network.chainId,
        value: ethers.toBigInt("0"),
        type: 0
      };

      console.log(`Adding ${stakeholder.role}:`);
      console.log(`  Wallet: ${stakeholder.wallet.address}`);
      console.log(`  Share: ${stakeholder.percentage/100}%`);
      
      const signedAddTx = await wallet.signTransaction(addTx);
      const addTxResponse = await provider.broadcastTransaction(signedAddTx);
      await provider.waitForTransaction(addTxResponse.hash, 1, 120000);
      console.log(`✅ Added ${stakeholder.role}\n`);

      // Save wallet info to a file for reference
      fs.appendFileSync(
        path.join(__dirname, "stakeholder-wallets.txt"),
        `${stakeholder.role}:\n` +
        `Address: ${stakeholder.wallet.address}\n` +
        `Private Key: ${stakeholder.wallet.privateKey}\n` +
        `Share: ${stakeholder.percentage/100}%\n\n`
      );
    }

    console.log("\n✅ All stakeholders added successfully!");
    console.log("💾 Wallet information saved to stakeholder-wallets.txt");

  } catch (error) {
    console.error("Error adding stakeholders:", error);
    process.exit(1);
  }
}

// Use the product address from your previous output
const productAddress = "0x08633B06c1250e80CDCD54314C4600661483C777";
addStakeholders(productAddress);