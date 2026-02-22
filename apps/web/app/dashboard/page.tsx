"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import Shell from "@/components/Shell";
import Dashboard from "@/components/Dashboard";
import EmptyState from "@/components/EmptyState";

export default function DashboardPage() {
  const { user, throws } = useApp();
  const router = useRouter();
  useEffect(() => { if (!user) router.replace("/"); }, [user, router]);
  if (!user) return null;
  return (
    <Shell>
      {throws.length === 0 ? <EmptyState /> : <Dashboard />}
    </Shell>
  );
}
