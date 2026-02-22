"use client";

import Link from "next/link";
import { useApp } from "@/contexts/AppContext";
import { useWallet } from "@/contexts/WalletContext";
import { POD_TYPES, GROWTH_MODELS, getCurrentStage } from "@/lib/store";
import { cn, timeAgo } from "@/lib/utils";
import { useRouter } from "next/navigation";
import ThrowNFTBadge from "./ThrowNFTBadge";
import type { UnifiedThrow } from "@/contexts/AppContext";

export default function Dashboard() {
  const { throws, throwsLoading, throwsError, refreshThrows } = useApp();
  const { shortAddress } = useWallet();
  const router = useRouter();

  const enriched = throws.map((t) => {
    const pt    = POD_TYPES.find((p) => p.id === t.podTypeId);
    const model = GROWTH_MODELS.find((m) => m.id === t.growthModelId);
    const stageData = model
      ? getCurrentStage(t.throwDate, model)
      : null;
    return { t, pt, stageData };
  });

  const totalHarvestable = enriched.filter(
    ({ stageData }) =>
      stageData && ["fruiting", "spread"].includes(stageData.stage.id)
  ).length;

  const dominantStage = (() => {
    const counts: Record<string, number> = {};
    enriched.forEach(({ stageData }) => {
      if (stageData) counts[stageData.stage.id] = (counts[stageData.stage.id] ?? 0) + 1;
    });
    return Object.entries(counts).sort(([, a], [, b]) => b - a)[0];
  })();

  const actionItems = enriched
    .filter(({ stageData }) => stageData && stageData.daysSince <= 14)
    .slice(0, 3);

  if (throwsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-4 border-eden-200 border-t-eden-600 rounded-full animate-spin" />
        <p className="text-eden-600 text-sm">Loading your forest from Algorand…</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 space-y-5 fade-up">

      {/* Error banner */}
      {throwsError && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Indexer error</p>
            <p className="text-xs text-amber-600 mt-0.5">{throwsError}</p>
          </div>
          <button
            onClick={refreshThrows}
            className="text-xs text-amber-700 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-sm text-center">
          <div className="text-3xl font-bold text-eden-700">{throws.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">Throws</div>
        </div>
        <div className="card-sm text-center">
          <div className="text-2xl">
            {dominantStage
              ? enriched.find((e) => e.stageData?.stage.id === dominantStage[0])?.stageData?.stage.icon
              : "🌱"}
          </div>
          <div className="text-xs text-gray-500 capitalize">
            {dominantStage?.[0] ?? "—"}
          </div>
        </div>
        <div className="card-sm text-center">
          <div className="text-3xl font-bold text-eden-700">{totalHarvestable}</div>
          <div className="text-xs text-gray-500 mt-0.5">Harvestable</div>
        </div>
      </div>

      {/* Action now */}
      {actionItems.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span>⚡</span> Action Now
          </h2>
          <div className="space-y-2">
            {actionItems.map(({ t, pt, stageData }) => (
              <Link
                key={t.localId}
                href={`/throw/${t.asaId || t.localId}`}
                className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl hover:bg-amber-100 transition-colors"
              >
                <span className="text-2xl">{stageData?.stage.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {pt?.name ?? "Pod"} — {stageData?.stage.name}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {stageData?.stage.whatToExpect}
                  </p>
                </div>
                <span className="text-gray-400">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Log new throw */}
      <button
        onClick={() => router.push("/throw/new")}
        className="btn-primary w-full"
      >
        💊 Log Another Throw
      </button>

      {/* Refresh button */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-700 flex items-center gap-2">
          <span>🌿</span> Your Throws ({throws.length})
        </h2>
        <button
          onClick={refreshThrows}
          className="text-xs text-eden-600 hover:text-eden-700 flex items-center gap-1"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Throw list */}
      <div className="space-y-3">
        {enriched.map(({ t, pt, stageData }) => (
          <Link
            key={t.localId}
            href={`/throw/${t.asaId || t.localId}`}
            className="card flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: (pt?.color ?? "#22c55e") + "30" }}
            >
              {t.asaId === 0
                ? <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                : pt?.icon ?? "🌱"}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-semibold text-gray-900 truncate">
                  {pt?.name ?? t.podTypeName ?? "Pod"}
                </span>
                {stageData && (
                  <span className="badge-stage flex-shrink-0">
                    {stageData.stage.icon} {stageData.stage.name}
                  </span>
                )}
                {t.asaId === 0 && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    confirming…
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-500">
                {timeAgo(t.throwDate)} · Day {stageData?.daysSince ?? 0}
              </p>

              {t.locationLabel && (
                <p className="text-xs text-gray-400 mt-0.5">📍 {t.locationLabel}</p>
              )}

              {t.asaId > 0 && (
                <div className="mt-1.5">
                  <ThrowNFTBadge asaId={t.asaId} size="sm" />
                </div>
              )}

              {stageData && (
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-eden-500 rounded-full transition-all"
                    style={{ width: `${stageData.progress}%` }}
                  />
                </div>
              )}
            </div>

            <span className="text-gray-400 flex-shrink-0">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
