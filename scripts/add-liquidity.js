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
    console.log("Connected as:", wallet.address);

    // Load token contracts
    const ERC20_ABI = [
      "function approve(address spender, uint value) external returns (bool)",
      "function balanceOf(address owner) view returns (uint256)",
      "function decimals() view returns (uint8)",
      "function transfer(address to, uint value) external returns (bool)",
    ];

    const tokenA = new ethers.Contract(config.tokenA, ERC20_ABI, wallet);
    const tokenB = new ethers.Contract(config.tokenB, ERC20_ABI, wallet);

    // Load pair contract
    const PAIR_ABI = [
      "function mint(address to) external returns (uint256 liquidity)",
      "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
    ];
    const pair = new ethers.Contract(config.uniswap.pair, PAIR_ABI, wallet);

    // Amount to add (adjust these values as needed)
    const amountA = ethers.parseUnits("1000", await tokenA.decimals());
    const amountB = ethers.parseUnits("1000", await tokenB.decimals());

    // Approve tokens with explicit transaction parameters
    console.log("Approving tokens...");
    const approveTxA = {
      to: config.tokenA,
      data: tokenA.interface.encodeFunctionData("approve", [
        config.uniswap.pair,
        amountA,
      ]),
      gasLimit: ethers.toBigInt("200000"),
      gasPrice: ethers.parseUnits("1", "gwei"),
      nonce: await provider.getTransactionCount(wallet.address),
      chainId: config.network.chainId,
      value: ethers.toBigInt("0"),
    };

    const signedApproveTxA = await wallet.signTransaction(approveTxA);
    const approveResponseA = await provider.broadcastTransaction(
      signedApproveTxA
    );
    await provider.waitForTransaction(approveResponseA.hash, 1, 120000);
    console.log("TokenA approved");

    const approveTxB = {
      to: config.tokenB,
      data: tokenB.interface.encodeFunctionData("approve", [
        config.uniswap.pair,
        amountB,
      ]),
      gasLimit: ethers.toBigInt("200000"),
      gasPrice: ethers.parseUnits("1", "gwei"),
      nonce: await provider.getTransactionCount(wallet.address),
      chainId: config.network.chainId,
      value: ethers.toBigInt("0"),
    };

    const signedApproveTxB = await wallet.signTransaction(approveTxB);
    const approveResponseB = await provider.broadcastTransaction(
      signedApproveTxB
    );
    await provider.waitForTransaction(approveResponseB.hash, 1, 120000);
    console.log("TokenB approved");

    // Transfer tokens to pair with explicit transaction parameters
    console.log("Transferring tokens to pair...");
    const transferTxA = {
      to: config.tokenA,
      data: tokenA.interface.encodeFunctionData("transfer", [
        config.uniswap.pair,
        amountA,
      ]),
      gasLimit: ethers.toBigInt("200000"),
      gasPrice: ethers.parseUnits("1", "gwei"),
      nonce: await provider.getTransactionCount(wallet.address),
      chainId: config.network.chainId,
      value: ethers.toBigInt("0"),
    };

    const signedTransferTxA = await wallet.signTransaction(transferTxA);
    const transferResponseA = await provider.broadcastTransaction(
      signedTransferTxA
    );
    await provider.waitForTransaction(transferResponseA.hash, 1, 120000);
    console.log("TokenA transferred");

    const transferTxB = {
      to: config.tokenB,
      data: tokenB.interface.encodeFunctionData("transfer", [
        config.uniswap.pair,
        amountB,
      ]),
      gasLimit: ethers.toBigInt("200000"),
      gasPrice: ethers.parseUnits("1", "gwei"),
      nonce: await provider.getTransactionCount(wallet.address),
      chainId: config.network.chainId,
      value: ethers.toBigInt("0"),
    };

    const signedTransferTxB = await wallet.signTransaction(transferTxB);
    const transferResponseB = await provider.broadcastTransaction(
      signedTransferTxB
    );
    await provider.waitForTransaction(transferResponseB.hash, 1, 120000);
    console.log("TokenB transferred");

    // Add liquidity by minting with explicit transaction parameters
    console.log("Adding liquidity...");
    const mintTx = {
      to: config.uniswap.pair,
      data: pair.interface.encodeFunctionData("mint", [wallet.address]),
      gasLimit: ethers.toBigInt("500000"),
      gasPrice: ethers.parseUnits("1", "gwei"),
      nonce: await provider.getTransactionCount(wallet.address),
      chainId: config.network.chainId,
      value: ethers.toBigInt("0"),
    };

    const signedMintTx = await wallet.signTransaction(mintTx);
    const mintResponse = await provider.broadcastTransaction(signedMintTx);
    await provider.waitForTransaction(mintResponse.hash, 1, 120000);
    console.log("Liquidity added successfully!");

    // Get final balances
    const balanceA = await tokenA.balanceOf(wallet.address);
    const balanceB = await tokenB.balanceOf(wallet.address);
    console.log("Final balances:");
    console.log(
      "TokenA:",
      ethers.formatUnits(balanceA, await tokenA.decimals())
    );
    console.log(
      "TokenB:",
      ethers.formatUnits(balanceB, await tokenB.decimals())
    );
  } catch (error) {
    console.error("Failed to add liquidity:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
