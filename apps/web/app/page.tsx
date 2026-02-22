"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import Landing from "@/components/Landing";

export default function HomePage() {
  const { user } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  return user ? (
    <div className="min-h-screen flex items-center justify-center bg-eden-950">
      <div className="text-6xl animate-spin">🌿</div>
    </div>
  ) : <Landing />;
}
