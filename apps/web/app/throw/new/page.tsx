"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import Shell from "@/components/Shell";
import ThrowWizard from "@/components/ThrowWizard";

export default function NewThrowPage() {
  const { user } = useApp();
  const router = useRouter();
  useEffect(() => { if (!user) router.replace("/"); }, [user, router]);
  if (!user) return null;
  return (
    <Shell hideNav>
      <ThrowWizard onComplete={(id) => router.push(`/throw/${id}`)} />
    </Shell>
  );
}
