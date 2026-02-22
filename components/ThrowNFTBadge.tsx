"use client";

import { explorerAssetUrl, explorerTxUrl } from "@/lib/algorand";
import { cn } from "@/lib/utils";

interface Props {
  asaId: number;
  txId?: string;
  className?: string;
  size?: "sm" | "md";
}

export default function ThrowNFTBadge({ asaId, txId, className, size = "sm" }: Props) {
  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <a
        href={explorerAssetUrl(asaId)}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center gap-1 rounded-xl font-medium transition-colors",
          "bg-purple-100 hover:bg-purple-200 text-purple-800",
          size === "sm" ? "text-xs px-2 py-1" : "text-sm px-3 py-1.5"
        )}
      >
        <span>◈</span>
        ASA #{asaId}
        <span className="text-purple-500">↗</span>
      </a>
      {txId && (
        <a
          href={explorerTxUrl(txId)}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex items-center gap-1 rounded-xl font-medium transition-colors",
            "bg-gray-100 hover:bg-gray-200 text-gray-600",
            size === "sm" ? "text-xs px-2 py-1" : "text-sm px-3 py-1.5"
          )}
        >
          tx ↗
        </a>
      )}
    </div>
  );
}
