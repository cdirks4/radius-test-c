"use client";

import { useState, useCallback } from "react";
import { ethers } from "ethers";
import IUniswapV2Factory from "../../../artifacts/contracts/interfaces/IUniswapV2Factory.sol/IUniswapV2Factory.json";
import IUniswapV2Pair from "../../../artifacts/contracts/interfaces/IUniswapV2Pair.sol/IUniswapV2Pair.json";
import IERC20 from "../../../artifacts/contracts/interfaces/IERC20.sol/IERC20.json";

interface SwapProps {
  provider: ethers.Provider;
  factoryAddress: string;
  tokenA: string;
  tokenB: string;
}

export function Swap({ provider, factoryAddress, tokenA, tokenB }: SwapProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reserves, setReserves] = useState({ reserve0: "0", reserve1: "0" });

  const getReserves = useCallback(async () => {
    try {
      const factory = new ethers.Contract(
        factoryAddress,
        IUniswapV2Factory.abi,
        provider
      );

      const pairAddress = await factory.getPair(tokenA, tokenB);
      if (pairAddress === ethers.ZeroAddress) {
        throw new Error("Pair does not exist");
      }

      const pair = new ethers.Contract(
        pairAddress,
        IUniswapV2Pair.abi,
        provider
      );

      const [reserve0, reserve1] = await pair.getReserves();
      setReserves({
        reserve0: ethers.formatEther(reserve0),
        reserve1: ethers.formatEther(reserve1),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get reserves");
    }
  }, [provider, factoryAddress, tokenA, tokenB]);

  const handleSwap = async () => {
    try {
      setLoading(true);
      setError(null);

      // Implementation will depend on your specific needs
      // This is just a placeholder to show the structure
      console.log("Swap initiated with amount:", amount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Swap failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Swap Tokens</h2>

      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Pool Reserves: {reserves.reserve0} / {reserves.reserve1}
        </p>
      </div>

      <div className="space-y-4">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount to swap"
          className="w-full p-2 border rounded"
        />

        <button
          onClick={handleSwap}
          disabled={loading || !amount}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          {loading ? "Swapping..." : "Swap"}
        </button>

        {error && (
          <div className="p-4 text-red-500 bg-red-50 rounded">{error}</div>
        )}
      </div>
    </div>
  );
}
