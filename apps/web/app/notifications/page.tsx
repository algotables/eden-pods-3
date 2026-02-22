"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import Shell from "@/components/Shell";
import NotifCenter from "@/components/NotifCenter";

export default function NotificationsPage() {
  const { user } = useApp();
  const router = useRouter();
  useEffect(() => { if (!user) router.replace("/"); }, [user, router]);
  if (!user) return null;
  return <Shell><NotifCenter /></Shell>;
}
