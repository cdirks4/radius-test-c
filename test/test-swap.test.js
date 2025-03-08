const { expect } = require("chai");
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

describe("Uniswap V2 Swap Tests", function () {
  let provider;
  let wallet;
  let tokenA;
  let tokenB;
  let router;
  let config;

  before(async function () {
    // Load configuration
    config = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../scripts/config.json"))
    );

    // Setup provider and wallet
    provider = new ethers.JsonRpcProvider(config.network.rpcUrl);
    wallet = new ethers.Wallet(config.privateKey, provider);

    // Setup contract instances
    const ERC20_ABI = [
      "function balanceOf(address owner) view returns (uint256)",
      "function approve(address spender, uint value) external returns (bool)",
      "function allowance(address owner, address spender) view returns (uint256)"
    ];

    tokenA = new ethers.Contract(config.tokenA, ERC20_ABI, wallet);
    tokenB = new ethers.Contract(config.tokenB, ERC20_ABI, wallet);

    const ROUTER_ABI = [
      "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
      "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)"
    ];

    router = new ethers.Contract(config.uniswap.router, ROUTER_ABI, wallet);
  });

  describe("Pre-swap checks", function () {
    it("Should have correct token balances", async function () {
      const balanceA = await tokenA.balanceOf(wallet.address);
      expect(balanceA).to.be.gt(0, "TokenA balance should be greater than 0");
    });

    it("Should approve router to spend tokens", async function () {
      const amountToApprove = ethers.parseEther("1000");
      const approveTx = await tokenA.approve(router.target, amountToApprove);
      await approveTx.wait();

      const allowance = await tokenA.allowance(wallet.address, router.target);
      expect(allowance).to.be.gte(amountToApprove, "Router allowance should be sufficient");
    });

    it("Should calculate correct output amounts", async function () {
      const amountIn = ethers.parseEther("1");
      const path = [config.tokenA, config.tokenB];
      const amounts = await router.getAmountsOut(amountIn, path);
      expect(amounts[0]).to.equal(amountIn, "Input amount should match");
      expect(amounts[1]).to.be.gt(0, "Output amount should be greater than 0");
    });
  });

  describe("Swap execution", function () {
    it("Should execute swap successfully", async function () {
      const amountIn = ethers.parseEther("1");
      const path = [config.tokenA, config.tokenB];
      
      // Get initial balances
      const initialBalanceA = await tokenA.balanceOf(wallet.address);
      const initialBalanceB = await tokenB.balanceOf(wallet.address);

      // Calculate minimum output amount with 1% slippage
      const amounts = await router.getAmountsOut(amountIn, path);
      const amountOutMin = amounts[1] - (amounts[1] / 100n);

      // Execute swap
      const deadline = Math.floor(Date.now() / 1000) + 300;
      const swapTx = await router.swapExactTokensForTokens(
        amountIn,
        amountOutMin,
        path,
        wallet.address,
        deadline
      );
      await swapTx.wait();

      // Check final balances
      const finalBalanceA = await tokenA.balanceOf(wallet.address);
      const finalBalanceB = await tokenB.balanceOf(wallet.address);

      expect(finalBalanceA).to.equal(initialBalanceA - amountIn, "TokenA balance should decrease by input amount");
      expect(finalBalanceB).to.be.gt(initialBalanceB, "TokenB balance should increase");
    });
  });
});