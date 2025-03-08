const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path"); // Added path import at the top

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint value) external returns (bool)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
];

const ROUTER_ABI = [
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
];

async function executeSwap() {
  try {
    // Load configuration
    const config = JSON.parse(
      fs.readFileSync(path.join(__dirname, "config.json"))
    );

    // Connect to network
    const provider = new ethers.JsonRpcProvider(config.network.rpcUrl);
    const wallet = new ethers.Wallet(config.privateKey, provider);
    console.log("\n👤 Wallet Address:", wallet.address);

    // Setup token contracts
    const tokenA = new ethers.Contract(config.tokenA, ERC20_ABI, wallet);
    const tokenB = new ethers.Contract(config.tokenB, ERC20_ABI, wallet);

    // Get token symbols and initial balances
    const [symbolA, symbolB, decimalsA, decimalsB] = await Promise.all([
      tokenA.symbol(),
      tokenB.symbol(),
      tokenA.decimals(),
      tokenB.decimals(),
    ]);

    const [balanceA, balanceB] = await Promise.all([
      tokenA.balanceOf(wallet.address),
      tokenB.balanceOf(wallet.address),
    ]);

    console.log("\n📊 Initial Balances:");
    console.log(`${symbolA}: ${ethers.formatUnits(balanceA, decimalsA)}`);
    console.log(`${symbolB}: ${ethers.formatUnits(balanceB, decimalsB)}`);

    // Setup router
    const router = new ethers.Contract(
      config.uniswap.router,
      ROUTER_ABI,
      wallet
    );
    const amountIn = ethers.parseEther("100"); // Swap 100 tokens

    // Approve router
    console.log("\n🔓 Approving router to spend tokens...");
    const approveTx = await tokenA.approve(router.target, amountIn);
    await approveTx.wait();
    console.log("✅ Approval successful");

    // Calculate expected output
    const path = [config.tokenA, config.tokenB];
    const amounts = await router.getAmountsOut(amountIn, path);
    const amountOutMin = amounts[1] - amounts[1] / 100n; // 1% slippage tolerance

    console.log("\n💱 Swap Details:");
    console.log(`Input: ${ethers.formatUnits(amountIn, decimalsA)} ${symbolA}`);
    console.log(
      `Expected Output: ${ethers.formatUnits(amounts[1], decimalsB)} ${symbolB}`
    );
    console.log(
      `Minimum Output: ${ethers.formatUnits(
        amountOutMin,
        decimalsB
      )} ${symbolB}`
    );

    // Execute swap
    console.log("\n🔄 Executing swap...");
    const deadline = Math.floor(Date.now() / 1000) + 300; // 5 minutes
    const swapTx = await router.swapExactTokensForTokens(
      amountIn,
      amountOutMin,
      path,
      wallet.address,
      deadline,
      { gasLimit: 300000 }
    );

    console.log("Transaction sent:", swapTx.hash);
    const receipt = await swapTx.wait();
    console.log("✅ Swap successful!");

    // Get final balances
    const [finalBalanceA, finalBalanceB] = await Promise.all([
      tokenA.balanceOf(wallet.address),
      tokenB.balanceOf(wallet.address),
    ]);

    console.log("\n📊 Final Balances:");
    console.log(`${symbolA}: ${ethers.formatUnits(finalBalanceA, decimalsA)}`);
    console.log(`${symbolB}: ${ethers.formatUnits(finalBalanceB, decimalsB)}`);
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  executeSwap()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

module.exports = { executeSwap };
