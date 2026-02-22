"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/contexts/WalletContext";
import { useApp } from "@/contexts/AppContext";
import Shell from "@/components/Shell";
import ThrowDetail from "@/components/ThrowDetail";

export default function ThrowPage({ params }: { params: { id: string } }) {
  const { isConnected } = useWallet();
  const { throws } = useApp();
  const router = useRouter();

  // ID can be an ASA ID (number) or a localId (uuid)
  const throwData = useMemo(
    () =>
      throws.find(
        (t) =>
          String(t.asaId) === params.id ||
          t.localId === params.id ||
          t.txId === params.id
      ),
    [throws, params.id]
  );

  useEffect(() => {
    if (!isConnected) router.replace("/");
  }, [isConnected, router]);

  useEffect(() => {
    if (isConnected && !throwData && throws.length > 0) {
      router.replace("/dashboard");
    }
  }, [isConnected, throwData, throws.length, router]);

  if (!isConnected || !throwData) return null;

  return (
    <Shell>
      <ThrowDetail throwData={throwData} />
    </Shell>
  );
}
