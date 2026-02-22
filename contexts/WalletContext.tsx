"use client";

import React, {
  createContext, useContext, useEffect,
  useState, useCallback, ReactNode,
} from "react";
import { getPeraWallet, shortenAddress } from "@/lib/algorand";

interface WalletState {
  address: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  shortAddress: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  error: string | null;
}

const WalletCtx = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress]         = useState<string | null>(null);
  const [isConnecting, setConnecting] = useState(false);
  const [error, setError]             = useState<string | null>(null);

  // Re-connect on mount if session exists
  useEffect(() => {
    const pera = getPeraWallet();

    pera.reconnectSession()
      .then((accounts) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
        }
      })
      .catch(() => {
        // No existing session — that's fine
      });

    // Listen for disconnect from Pera app side
    pera.connector?.on("disconnect", () => {
      setAddress(null);
    });
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const pera = getPeraWallet();
      const accounts = await pera.connect();
      setAddress(accounts[0]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      // User rejected — not really an error
      if (!msg.includes("closed") && !msg.includes("rejected")) {
        setError(msg);
      }
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    const pera = getPeraWallet();
    pera.disconnect();
    setAddress(null);
    setError(null);
  }, []);

  return (
    <WalletCtx.Provider value={{
      address,
      isConnecting,
      isConnected: !!address,
      shortAddress: address ? shortenAddress(address) : "",
      connect,
      disconnect,
      error,
    }}>
      {children}
    </WalletCtx.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletCtx);
  if (!ctx) throw new Error("useWallet must be inside WalletProvider");
  return ctx;
}
