"use client";

import React, {
  createContext, useContext, useEffect,
  useState, useCallback, ReactNode,
} from "react";
import { PeraWalletConnect } from "@perawallet/connect";

let _pera: PeraWalletConnect | null = null;
function getPeraWallet() {
  if (!_pera) {
    _pera = new PeraWalletConnect({ network: "testnet", shouldShowSignTxnToast: true });
  }
  return _pera;
}

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

function shorten(addr: string, n = 4) {
  return addr ? `${addr.slice(0, n)}...${addr.slice(-n)}` : "";
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress]   = useState<string | null>(null);
  const [isConnecting, setConn] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    const pera = getPeraWallet();
    pera.reconnectSession()
      .then((accounts: string[]) => { if (accounts.length) setAddress(accounts[0]); })
      .catch(() => {});
  }, []);

  const connect = useCallback(async () => {
    setConn(true);
    setError(null);
    try {
      const pera = getPeraWallet();
      const accounts = await pera.connect();
      setAddress(accounts[0]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      if (!msg.includes("closed") && !msg.includes("rejected") && !msg.includes("cancel")) {
        setError(msg);
      }
    } finally {
      setConn(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    getPeraWallet().disconnect();
    setAddress(null);
    setError(null);
  }, []);

  return (
    <WalletCtx.Provider value={{
      address,
      isConnecting,
      isConnected: !!address,
      shortAddress: address ? shorten(address) : "",
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
