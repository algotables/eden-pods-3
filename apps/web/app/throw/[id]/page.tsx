"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import Shell from "@/components/Shell";
import ThrowDetail from "@/components/ThrowDetail";

export default function ThrowPage({ params }: { params: { id: string } }) {
  const { user, throws } = useApp();
  const router = useRouter();
  const t = throws.find((x) => x.id === params.id);
  useEffect(() => { if (!user) router.replace("/"); }, [user, router]);
  useEffect(() => { if (user && !t) router.replace("/dashboard"); }, [user, t, router]);
  if (!user || !t) return null;
  return <Shell><ThrowDetail throwData={t} /></Shell>;
}
