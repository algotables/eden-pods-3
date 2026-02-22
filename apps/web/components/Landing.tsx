"use client";

import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function Landing() {
  const { signIn } = useApp();
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Enter your name to start"); return; }
    setLoading(true);
    signIn(name.trim());
    toast.success(`Welcome, ${name.trim()}! 🌱`);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-eden-950 via-eden-900 to-eden-800 flex flex-col items-center justify-center px-6">
      {/* Hero */}
      <div className="sprout mb-6 text-center">
        <div className="text-8xl leading-none">🌱</div>
      </div>
      <h1 className="text-5xl font-bold text-white text-center mb-2 fade-up">Eden Pods</h1>
      <p className="text-eden-300 text-xl text-center mb-1 fade-up">Throw a seed. Grow a forest.</p>
      <p className="text-eden-400 text-sm text-center mb-8 max-w-xs fade-up leading-relaxed">
        Biodegradable seed pods that create self-sustaining food forests. Zero skill required.
      </p>

      {/* Feature pills */}
      <div className="flex flex-wrap gap-2 justify-center mb-8 fade-up">
        {["🎯 Throw & Go","🔄 Self-Replicating","🥗 Real Food","🌍 Zero Waste"].map((f) => (
          <span key={f} className="bg-eden-800/60 text-eden-200 px-3 py-1.5 rounded-full text-sm border border-eden-700/50">
            {f}
          </span>
        ))}
      </div>

      {/* Sign-in card */}
      <div className="w-full max-w-sm fade-up">
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20">
          <h2 className="text-white text-xl font-semibold text-center mb-4">Get Started — Free</h2>
          <form onSubmit={handleStart} className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your first name"
              className="w-full bg-white/10 border border-white/30 text-white placeholder-eden-400 rounded-2xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-eden-400"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="btn-primary w-full bg-eden-500 hover:bg-eden-400 disabled:opacity-50"
            >
              {loading ? "Starting…" : "Start Growing 🌿"}
            </button>
          </form>
          <p className="text-eden-500 text-xs text-center mt-3">
            No account needed. Your data stays on this device.
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-3 gap-4 mt-8 max-w-xs fade-up">
        {[["💊","Throw pod"],["📱","Log it"],["⏰","Track stages"]].map(([icon,text]) => (
          <div key={text} className="text-center">
            <div className="text-3xl mb-1">{icon}</div>
            <p className="text-eden-400 text-xs">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
