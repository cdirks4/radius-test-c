"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ethers } from "ethers";

interface Block {
  number: number;
  hash: string;
  timestamp: number;
}

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
}

export default function Home() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isArbitrum, setIsArbitrum] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const RPC_URLS = {
    radius:
      process.env.NEXT_PUBLIC_RPC_URL ||
      "https://rpc.testnet.tryradi.us/6ba92c970d9cec7e019d47c8e0ae5e65b2343e7388d560a7",
    arbitrum: "https://arbitrum.llamarpc.com",
  };

  useEffect(() => {
    fetchBlockchainData();
  }, [isArbitrum]); // Re-fetch when network changes

  const fetchBlockchainData = async () => {
    try {
      setError(null);
      const provider = new ethers.JsonRpcProvider(
        isArbitrum ? RPC_URLS.arbitrum : RPC_URLS.radius
      );

      // Get the latest block number
      const latestBlockNumber = await provider.getBlockNumber();

      // Fetch last 5 blocks
      const blockPromises = [];
      for (let i = 0; i < 5; i++) {
        if (latestBlockNumber - i >= 0) {
          blockPromises.push(provider.getBlock(latestBlockNumber - i));
        }
      }
      const blocksData = await Promise.all(blockPromises);

      // Format blocks data
      const formattedBlocks = blocksData.map((block) => ({
        number: Number(block?.number),
        hash: block?.hash || "",
        timestamp: Number(block?.timestamp),
      }));

      setBlocks(formattedBlocks);

      // Fetch transactions from the latest block
      if (blocksData[0]?.transactions) {
        const txPromises = blocksData[0].transactions
          .slice(0, 5)
          .map((txHash) => provider.getTransaction(txHash));
        const txsData = await Promise.all(txPromises);

        // Format transactions data
        const formattedTxs = txsData.map((tx) => ({
          hash: tx?.hash || "",
          from: tx?.from || "",
          to: tx?.to || "",
          value: tx ? ethers.formatEther(tx.value) : "0",
        }));

        setTransactions(formattedTxs);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching blockchain data:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to fetch blockchain data"
      );
      setBlocks([]);
      setTransactions([]);
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-rows-[auto_1fr_auto] min-h-screen p-8 gap-8 font-[family-name:var(--font-geist-sans)]">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold mb-4">
          {isArbitrum ? "Arbitrum" : "Radius Testnet"} Explorer
        </h1>
        <button
          onClick={() => {
            setIsArbitrum(!isArbitrum);
            setLoading(true);
          }}
          className="px-4 py-2 rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] text-sm"
        >
          Switch to {isArbitrum ? "Radius" : "Arbitrum"}
        </button>
      </header>

      <main className="flex flex-col gap-8">
        {loading ? (
          <div className="text-center">Loading blockchain data...</div>
        ) : error ? (
          <div className="p-4 border border-red-500 rounded-lg bg-red-50 dark:bg-red-900/20">
            <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">
              Error
            </h2>
            <p className="text-red-600 dark:text-red-400 font-mono text-sm">
              {error}
            </p>
          </div>
        ) : (
          <>
            <section>
              <h2 className="text-xl font-semibold mb-4">Recent Blocks</h2>
              <div className="grid gap-4">
                {blocks.map((block) => (
                  <div key={block.hash} className="p-4 border rounded-lg">
                    <div className="font-mono text-sm">
                      <p>Block: {block.number}</p>
                      <p className="truncate">Hash: {block.hash}</p>
                      <p>
                        Time:{" "}
                        {new Date(block.timestamp * 1000).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">
                Recent Transactions
              </h2>
              <div className="grid gap-4">
                {transactions.map((tx) => (
                  <div key={tx.hash} className="p-4 border rounded-lg">
                    <div className="font-mono text-sm">
                      <p className="truncate">Hash: {tx.hash}</p>
                      <p className="truncate">From: {tx.from}</p>
                      <p className="truncate">To: {tx.to}</p>
                      <p>Value: {tx.value} ETH</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="text-center text-sm text-gray-500">
        Powered by {isArbitrum ? "Arbitrum" : "Radius Testnet"}
      </footer>
    </div>
  );
}
