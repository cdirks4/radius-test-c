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
      "function allowance(address owner, address spender) view returns (uint256)",
    ];

    tokenA = new ethers.Contract(config.tokenA, ERC20_ABI, wallet);
    tokenB = new ethers.Contract(config.tokenB, ERC20_ABI, wallet);

    const ROUTER_ABI = [
      "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
      "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
    ];

    router = new ethers.Contract(config.uniswap.router, ROUTER_ABI, wallet);
  });

  describe("Pre-swap checks", function () {
    it("Should have correct token balances", async function () {
      const balanceA = await tokenA.balanceOf(wallet.address);
      expect(balanceA).to.be.gt(0, "TokenA balance should be greater than 0");
    });
  });
});
