"use client";

import { useWallet } from "@/contexts/WalletContext";
import { explorerAssetUrl, EXPLORER_BASE } from "@/lib/algorand";
import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  showBalance?: boolean;
}

export default function WalletBadge({ className }: Props) {
  const { address, shortAddress, disconnect, isConnected } = useWallet();
  const { userName } = useApp();

  if (!isConnected) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <a
        href={`${EXPLORER_BASE}/address/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 bg-eden-100 hover:bg-eden-200 text-eden-800 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors"
      >
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        {userName ? `${userName} · ` : ""}{shortAddress}
        <span className="text-eden-500 text-xs">↗</span>
      </a>
      <button
        onClick={disconnect}
        className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
        title="Disconnect wallet"
      >
        ✕
      </button>
    </div>
  );
}
