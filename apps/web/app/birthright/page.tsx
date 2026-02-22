"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import Shell from "@/components/Shell";
import Birthright from "@/components/Birthright";

export default function BirthrightPage() {
  const { user } = useApp();
  const router = useRouter();
  useEffect(() => { if (!user) router.replace("/"); }, [user, router]);
  if (!user) return null;
  return <Shell><Birthright /></Shell>;
}
