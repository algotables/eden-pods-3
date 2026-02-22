"use client";

import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useWallet } from "@/contexts/WalletContext";
import { POD_TYPES, PodType } from "@/lib/store";
import {
  buildMintThrowTxns,
  signAndSendTxns,
  explorerAssetUrl,
} from "@/lib/algorand";
import type { UnifiedThrow } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { v4 as uuid } from "uuid";

type Step = "pod" | "when" | "where" | "review";
const STEPS: Step[] = ["pod", "when", "where", "review"];

export default function ThrowWizard({
  onComplete,
}: {
  onComplete: (id: string) => void;
}) {
  const { addPendingThrow, refreshThrows } = useApp();
  const { address } = useWallet();

  const now = new Date();
  const [step, setStep]         = useState<Step>("pod");
  const [podType, setPodType]   = useState<PodType | null>(null);
  const [date, setDate]         = useState(now.toISOString().split("T")[0]);
  const [time, setTime]         = useState(now.toTimeString().slice(0, 5));
  const [location, setLocation] = useState("");
  const [notes, setNotes]       = useState("");
  const [saving, setSaving]     = useState(false);
  const [txStatus, setTxStatus] = useState("");

  const idx      = STEPS.indexOf(step);
  const progress = ((idx + 1) / STEPS.length) * 100;
  const canNext  = step === "pod" ? !!podType : true;

  const next = () => setStep(STEPS[idx + 1]);
  const back = () =>
    idx > 0 ? setStep(STEPS[idx - 1]) : window.history.back();

  const save = async () => {
    if (!podType || !address) return;
    setSaving(true);

    const throwDate = new Date(`${date}T${time}`).toISOString();

    // Build optimistic pending throw for instant UI feedback
    const optimisticThrow: UnifiedThrow = {
      localId:       uuid(),
      asaId:         0,           // unknown until confirmed
      txId:          "pending",
      throwDate,
      podTypeId:     podType.id,
      podTypeName:   podType.name,
      podTypeIcon:   podType.icon,
      locationLabel: location,
      growthModelId: podType.growthModelId,
      thrownBy:      address,
      confirmedAt:   new Date().toISOString(),
      explorerUrl:   "",
    };

    addPendingThrow(optimisticThrow);

    try {
      setTxStatus("Building transaction…");

      const txns = await buildMintThrowTxns({
        senderAddress: address,
        metadata: {
          podTypeId:     podType.id,
          podTypeName:   podType.name,
          podTypeIcon:   podType.icon,
          throwDate,
          locationLabel: location,
          growthModelId: podType.growthModelId,
          thrownBy:      address,
          version:       1,
        },
      });

      setTxStatus("Waiting for Pera signature…");
      const result = await signAndSendTxns(txns, address);

      setTxStatus("Confirming on Algorand…");

      const asaId = result.assetId ?? 0;
      const txId  = result.txIds[0] ?? "";

      toast.success(
        <span>
          🌱 Throw minted!{" "}
          {asaId > 0 && (
            <a
              href={explorerAssetUrl(asaId)}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              ASA #{asaId} ↗
            </a>
          )}
        </span>,
        { duration: 6000 }
      );

      // Refresh from chain (with small delay for indexer propagation)
      setTimeout(() => refreshThrows(), 3000);

      onComplete(txId || optimisticThrow.localId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transaction failed";

      if (msg.includes("closed") || msg.includes("rejected")) {
        toast.error("Transaction cancelled");
      } else {
        toast.error(`Failed: ${msg}`);
        console.error(err);
      }

      setSaving(false);
      setTxStatus("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={back}
            className="p-2 rounded-xl hover:bg-gray-100 text-xl"
          >
            ←
          </button>
          <span className="text-sm text-gray-500 font-medium">
            Step {idx + 1} of {STEPS.length}
          </span>
          <div className="w-10" />
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-eden-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-4 fade-up overflow-y-auto">

        {/* Step: Pod type */}
        {step === "pod" && (
          <div>
            <h2 className="text-2xl font-bold text-eden-900 mb-1">Which pod?</h2>
            <p className="text-gray-500 text-sm mb-5">
              Choose the seed pod you threw — this becomes your NFT
            </p>
            <div className="space-y-3">
              {POD_TYPES.map((pt) => (
                <button
                  key={pt.id}
                  onClick={() => setPodType(pt)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all",
                    podType?.id === pt.id
                      ? "border-eden-500 bg-eden-50"
                      : "border-gray-200 hover:border-eden-300"
                  )}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                    style={{ backgroundColor: pt.color + "25" }}
                  >
                    {pt.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-semibold text-gray-900">{pt.name}</span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        pt.difficulty === "easy"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      )}>
                        {pt.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-1">{pt.description}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {pt.nutritionTags.slice(0, 3).map((t) => (
                        <span key={t} className="tag">{t}</span>
                      ))}
                    </div>
                  </div>
                  {podType?.id === pt.id && (
                    <span className="text-eden-500 text-xl flex-shrink-0">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: When */}
        {step === "when" && (
          <div>
            <h2 className="text-2xl font-bold text-eden-900 mb-1">When?</h2>
            <p className="text-gray-500 text-sm mb-5">
              This date gets recorded on-chain in your throw NFT
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">📅 Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={now.toISOString().split("T")[0]}
                  className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3.5 text-base focus:outline-none focus:border-eden-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">⏰ Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3.5 text-base focus:outline-none focus:border-eden-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">📝 Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Threw near the stream at the edge of the park"
                  rows={3}
                  className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:border-eden-400 resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step: Where */}
        {step === "where" && (
          <div>
            <h2 className="text-2xl font-bold text-eden-900 mb-1">Where?</h2>
            <p className="text-gray-500 text-sm mb-1">
              General label only — no GPS stored on-chain
            </p>
            <p className="text-xs text-gray-400 mb-5">
              🔒 Your exact location stays private
            </p>
            <div className="space-y-3">
              {[
                ["🏡", "Back garden"],
                ["🌳", "Park nearby"],
                ["🛣️", "Roadside verge"],
                ["🌲", "Forest edge"],
                ["🏞️", "Riverbank"],
                ["🌾", "Countryside"],
              ].map(([icon, label]) => (
                <button
                  key={label}
                  onClick={() => setLocation(label)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all",
                    location === label
                      ? "border-eden-500 bg-eden-50"
                      : "border-gray-200 hover:border-eden-300"
                  )}
                >
                  <span className="text-2xl">{icon}</span>
                  <span className="font-medium text-gray-800">{label}</span>
                  {location === label && (
                    <span className="ml-auto text-eden-500">✓</span>
                  )}
                </button>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or type your own:
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Gran's allotment"
                  className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:border-eden-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step: Review */}
        {step === "review" && podType && (
          <div>
            <h2 className="text-2xl font-bold text-eden-900 mb-1">
              Mint your throw NFT
            </h2>
            <p className="text-gray-500 text-sm mb-5">
              This will create an ARC-69 NFT on Algorand testnet
            </p>

            <div className="card space-y-4 mb-4">
              <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
                  style={{ backgroundColor: podType.color + "30" }}
                >
                  {podType.icon}
                </div>
                <div>
                  <p className="font-bold text-lg text-gray-900">{podType.name}</p>
                  <p className="text-sm text-gray-500">{podType.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  ["📅 Date", date],
                  ["⏰ Time", time],
                  ["📍 Location", location || "Not specified"],
                  ["🧬 Type", podType.growthModelId.replace(/-/g, " ")],
                ].map(([label, value]) => (
                  <div key={label as string} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* What happens next */}
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-4">
              <p className="text-sm font-semibold text-purple-800 mb-2">
                ◈ What gets minted
              </p>
              <ul className="text-xs text-purple-700 space-y-1">
                <li>• ARC-69 NFT with supply of 1</li>
                <li>• Name: &quot;Eden Throw — {podType.icon} {podType.name}&quot;</li>
                <li>• Metadata: pod type, throw date, location label</li>
                <li>• Permanently on Algorand testnet</li>
                <li>• Visible in Pera wallet under your assets</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
              <p className="text-xs text-amber-700">
                💰 Fee: ~0.001 ALGO (testnet). Pera will ask you to confirm.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 pb-8 bg-white border-t border-gray-100">
        {saving ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-eden-200 border-t-eden-600 rounded-full animate-spin" />
              <span className="text-eden-700 font-medium">{txStatus}</span>
            </div>
            <p className="text-xs text-gray-400 text-center">
              Check your Pera wallet app to sign the transaction
            </p>
          </div>
        ) : step !== "review" ? (
          <button
            onClick={next}
            disabled={!canNext}
            className="btn-primary w-full disabled:opacity-50"
          >
            Continue →
          </button>
        ) : (
          <button
            onClick={save}
            className="btn-primary w-full bg-purple-600 hover:bg-purple-700"
          >
            ◈ Mint Throw NFT
          </button>
        )}
      </div>
    </div>
  );
}
