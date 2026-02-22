"use client";

import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { POD_TYPES, PodType } from "@/lib/store";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

type Step = "pod" | "when" | "where" | "review";
const STEPS: Step[] = ["pod", "when", "where", "review"];

interface Props { onComplete: (id: string) => void; }

export default function ThrowWizard({ onComplete }: Props) {
  const { addThrow, user } = useApp();
  const now = new Date();

  const [step, setStep] = useState<Step>("pod");
  const [podType, setPodType] = useState<PodType | null>(null);
  const [date, setDate] = useState(now.toISOString().split("T")[0]);
  const [time, setTime] = useState(now.toTimeString().slice(0, 5));
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const idx = STEPS.indexOf(step);
  const progress = ((idx + 1) / STEPS.length) * 100;
  const canNext = step === "pod" ? !!podType : true;

  const next = () => setStep(STEPS[idx + 1]);
  const back = () => idx > 0 ? setStep(STEPS[idx - 1]) : window.history.back();

  const save = () => {
    if (!podType || !user) return;
    setSaving(true);
    try {
      const t = addThrow({
        userId: user.id,
        podTypeId: podType.id,
        growthModelId: podType.growthModelId,
        throwDate: new Date(`${date}T${time}`).toISOString(),
        locationLabel: location,
        notes,
      });
      toast.success("🌱 Pod logged! Watch it grow.");
      onComplete(t.id);
    } catch {
      toast.error("Something went wrong. Try again.");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <button onClick={back} className="p-2 rounded-xl hover:bg-gray-100 text-xl">←</button>
          <span className="text-sm text-gray-500 font-medium">Step {idx + 1} of {STEPS.length}</span>
          <div className="w-10" />
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-eden-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-4 fade-up overflow-y-auto">

        {/* Step: Choose pod */}
        {step === "pod" && (
          <div>
            <h2 className="text-2xl font-bold text-eden-900 mb-1">Which pod?</h2>
            <p className="text-gray-500 text-sm mb-5">Choose the seed pod you threw</p>
            <div className="space-y-3">
              {POD_TYPES.map((pt) => (
                <button key={pt.id} onClick={() => setPodType(pt)}
                  className={cn("w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all",
                    podType?.id === pt.id ? "border-eden-500 bg-eden-50" : "border-gray-200 hover:border-eden-300"
                  )}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                    style={{ backgroundColor: pt.color + "25" }}>
                    {pt.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-semibold text-gray-900">{pt.name}</span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                        pt.difficulty === "easy" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      )}>{pt.difficulty}</span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-1">{pt.description}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {pt.nutritionTags.slice(0, 3).map((t) => <span key={t} className="tag">{t}</span>)}
                    </div>
                  </div>
                  {podType?.id === pt.id && <span className="text-eden-500 text-xl">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: When */}
        {step === "when" && (
          <div>
            <h2 className="text-2xl font-bold text-eden-900 mb-1">When did you throw it?</h2>
            <p className="text-gray-500 text-sm mb-5">Default is right now — backdate if needed</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">📅 Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  max={now.toISOString().split("T")[0]}
                  className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3.5 text-base focus:outline-none focus:border-eden-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">⏰ Time</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3.5 text-base focus:outline-none focus:border-eden-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">📝 Notes (optional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Tossed near the big oak tree"
                  rows={3} className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:border-eden-400 resize-none" />
              </div>
            </div>
          </div>
        )}

        {/* Step: Where */}
        {step === "where" && (
          <div>
            <h2 className="text-2xl font-bold text-eden-900 mb-1">Where did you throw it?</h2>
            <p className="text-gray-500 text-sm mb-5">Optional — type a label for the spot</p>
            <div className="space-y-3">
              {["Back garden","Park nearby","Roadside verge","Forest edge","Riverbank","Skip"].map((opt) => (
                <button key={opt} onClick={() => setLocation(opt === "Skip" ? "" : opt)}
                  className={cn("w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all",
                    (opt === "Skip" ? location === "" : location === opt)
                      ? "border-eden-500 bg-eden-50" : "border-gray-200 hover:border-eden-300"
                  )}>
                  <span className="text-2xl">
                    {opt === "Back garden" ? "🏡" : opt === "Park nearby" ? "🌳" : opt === "Roadside verge" ? "🛣️"
                      : opt === "Forest edge" ? "🌲" : opt === "Riverbank" ? "🏞️" : "⏭️"}
                  </span>
                  <span className="font-medium text-gray-800">{opt}</span>
                  {(opt === "Skip" ? location === "" : location === opt) && (
                    <span className="ml-auto text-eden-500">✓</span>
                  )}
                </button>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Or type your own:</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Mum's allotment"
                  className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:border-eden-400" />
              </div>
            </div>
          </div>
        )}

        {/* Step: Review */}
        {step === "review" && podType && (
          <div>
            <h2 className="text-2xl font-bold text-eden-900 mb-1">Ready to log?</h2>
            <p className="text-gray-500 text-sm mb-5">Review your pod throw</p>
            <div className="card space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
                  style={{ backgroundColor: podType.color + "30" }}>
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
                  ["🧬 Model", podType.growthModelId.replace(/-/g, " ")],
                ].map(([label, value]) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{value}</p>
                  </div>
                ))}
              </div>
              {notes && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-0.5">📝 Notes</p>
                  <p className="text-sm text-gray-700">{notes}</p>
                </div>
              )}
              <div className="bg-eden-50 border border-eden-200 rounded-2xl p-3">
                <p className="text-xs text-eden-700 font-semibold">
                  🌱 First stage: <span className="font-bold">Germination</span> (0–14 days)
                </p>
                <p className="text-xs text-eden-600 mt-0.5">
                  No visible changes yet — keep the area slightly moist if possible
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="px-5 py-4 pb-8 bg-white border-t border-gray-100">
        {step !== "review" ? (
          <button onClick={next} disabled={!canNext}
            className="btn-primary w-full disabled:opacity-50">
            Continue →
          </button>
        ) : (
          <button onClick={save} disabled={saving}
            className="btn-primary w-full bg-eden-600">
            {saving ? "Saving…" : "🌱 Log My Pod Throw!"}
          </button>
        )}
      </div>
    </div>
  );
}
