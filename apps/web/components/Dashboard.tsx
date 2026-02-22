"use client";

import Link from "next/link";
import { useApp } from "@/contexts/AppContext";
import { POD_TYPES, GROWTH_MODELS, getCurrentStage } from "@/lib/store";
import { cn, timeAgo } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { throws } = useApp();
  const router = useRouter();

  const enriched = throws.map((t) => {
    const pt = POD_TYPES.find((p) => p.id === t.podTypeId)!;
    const model = GROWTH_MODELS.find((m) => m.id === t.growthModelId)!;
    const { stage, daysSince, progress } = getCurrentStage(t.throwDate, model);
    return { t, pt, stage, daysSince, progress };
  });

  const stageCounts = enriched.reduce<Record<string, number>>((acc, { stage }) => {
    acc[stage.id] = (acc[stage.id] ?? 0) + 1;
    return acc;
  }, {});
  const dominant = Object.entries(stageCounts).sort(([, a], [, b]) => b - a)[0];
  const actionItems = enriched.filter(({ daysSince }) => daysSince <= 14).slice(0, 3);

  return (
    <div className="px-4 py-5 space-y-5 fade-up">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-sm text-center">
          <div className="text-3xl font-bold text-eden-700">{throws.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">Throws</div>
        </div>
        <div className="card-sm text-center">
          <div className="text-2xl">{dominant ? enriched.find(e => e.stage.id === dominant[0])?.stage.icon : "🌱"}</div>
          <div className="text-xs text-gray-500 capitalize">{dominant?.[0] ?? "—"}</div>
        </div>
        <div className="card-sm text-center">
          <div className="text-3xl font-bold text-eden-700">
            {enriched.filter(e => ["fruiting","spread"].includes(e.stage.id)).length}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Harvestable</div>
        </div>
      </div>

      {/* Action now */}
      {actionItems.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-700 mb-2 flex items-center gap-2"><span>⚡</span> Action Now</h2>
          <div className="space-y-2">
            {actionItems.map(({ t, pt, stage }) => (
              <Link key={t.id} href={`/throw/${t.id}`}
                className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl hover:bg-amber-100 transition-colors">
                <span className="text-2xl">{stage.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{pt.name} — {stage.name}</p>
                  <p className="text-xs text-gray-500 line-clamp-1">{stage.whatToExpect}</p>
                </div>
                <span className="text-gray-400">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Log new throw */}
      <button onClick={() => router.push("/throw/new")} className="btn-primary w-full">
        💊 Log Another Throw
      </button>

      {/* Throw list */}
      <div>
        <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span>🌿</span> Your Throws ({throws.length})
        </h2>
        <div className="space-y-3">
          {enriched.map(({ t, pt, stage, daysSince, progress }) => (
            <Link key={t.id} href={`/throw/${t.id}`}
              className="card flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: pt.color + "30" }}>
                {pt.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-gray-900 truncate">{pt.name}</span>
                  <span className="badge-stage flex-shrink-0">{stage.icon} {stage.name}</span>
                </div>
                <p className="text-sm text-gray-500">{timeAgo(t.throwDate)} · Day {daysSince}</p>
                {t.locationLabel && (
                  <p className="text-xs text-gray-400 mt-0.5">📍 {t.locationLabel}</p>
                )}
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-eden-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <span className="text-gray-400 flex-shrink-0">→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
