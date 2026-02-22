"use client";

import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ConnectWallet() {
  const { connect, isConnecting, error } = useWallet();
  const router = useRouter();
  const [name, setName]   = useState("");
  const [step, setStep]   = useState<"name" | "wallet">("name");
  const [loading, setLoading] = useState(false);

  const handleName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Enter your name first"); return; }
    if (typeof window !== "undefined") {
      localStorage.setItem("eden-pods-username", name.trim());
    }
    setStep("wallet");
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      await connect();
      toast.success("Wallet connected! 🌱");
      router.push("/dashboard");
    } catch {
      // error shown via context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 w-full">
      {step === "name" ? (
        <>
          <h2 className="text-white text-xl font-semibold text-center mb-1">Get Started</h2>
          <p className="text-eden-400 text-xs text-center mb-4">Your food forest, on Algorand testnet</p>
          <form onSubmit={handleName} className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your first name"
              autoFocus
              className="w-full bg-white/10 border border-white/30 text-white placeholder-eden-400 rounded-2xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-eden-400"
            />
            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full bg-eden-500 hover:bg-eden-400 disabled:opacity-50 text-white font-semibold py-4 rounded-2xl transition-all active:scale-95"
            >
              Continue →
            </button>
          </form>
        </>
      ) : (
        <>
          <h2 className="text-white text-xl font-semibold text-center mb-1">Connect Wallet</h2>
          <p className="text-eden-400 text-xs text-center mb-5">
            Throws are minted as NFTs on Algorand testnet
          </p>

          <button
            onClick={handleConnect}
            disabled={isConnecting || loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-semibold py-4 px-6 rounded-2xl hover:bg-gray-50 active:scale-95 transition-all shadow-sm disabled:opacity-60 mb-3"
          >
            {isConnecting || loading ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
                Connecting…
              </>
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                  <rect width="32" height="32" rx="8" fill="#FFEE55"/>
                  <path d="M8 22V10h6.5c3.5 0 5.5 1.8 5.5 4.5S18 19 14.5 19H11v3H8zm3-6h3.2c1.7 0 2.8-.8 2.8-2s-1.1-2-2.8-2H11v4z" fill="#1A1A1A"/>
                  <circle cx="22" cy="20" r="3" fill="#1A1A1A"/>
                </svg>
                Connect Pera Wallet
              </>
            )}
          </button>

          {error && (
            <div className="bg-red-900/40 border border-red-700 rounded-xl px-4 py-2 mb-3">
              <p className="text-red-300 text-xs">{error}</p>
            </div>
          )}

          <div className="bg-amber-900/30 border border-amber-700/50 rounded-2xl p-3 mb-3">
            <p className="text-amber-300 text-xs font-semibold mb-1">🧪 Testnet Mode</p>
            <p className="text-amber-400 text-xs leading-relaxed">
              Need test ALGO?{" "}
              <a
                href="https://dispenser.testnet.aws.algodev.network/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-amber-300 hover:text-amber-200"
              >
                Get free testnet ALGO →
              </a>
            </p>
          </div>

          <button
            onClick={() => setStep("name")}
            className="w-full text-eden-500 text-sm hover:text-eden-400 py-1"
          >
            ← Back
          </button>
        </>
      )}
    </div>
  );
}
