"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/contexts/WalletContext";
import ConnectWallet from "@/components/ConnectWallet";

export default function HomePage() {
  const { isConnected } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) router.replace("/dashboard");
  }, [isConnected, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-eden-950 via-eden-900 to-eden-800 flex flex-col items-center justify-center px-6">
      <div className="mb-6 text-center">
        <div className="text-8xl leading-none">🌱</div>
      </div>
      <h1 className="text-5xl font-bold text-white text-center mb-2">Eden Pods</h1>
      <p className="text-eden-300 text-xl text-center mb-1">Throw a seed. Grow a forest.</p>
      <p className="text-eden-400 text-sm text-center mb-2 max-w-xs leading-relaxed">
        Each pod throw is minted as an NFT on Algorand testnet.
      </p>
      <div className="flex items-center gap-2 mb-8">
        <span className="bg-eden-800/60 text-eden-300 text-xs px-3 py-1.5 rounded-full border border-eden-700/50 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          Algorand Testnet
        </span>
        <span className="bg-eden-800/60 text-eden-300 text-xs px-3 py-1.5 rounded-full border border-eden-700/50">
          ARC-69 NFTs
        </span>
      </div>
      <div className="w-full max-w-sm">
        <ConnectWallet />
      </div>
    </div>
  );
}
