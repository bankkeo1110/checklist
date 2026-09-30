"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Spinner from "@/components/Spinner";

export default function GrowthForm({
  childId,
  latestHeightCm,
  latestWeightKg,
}: {
  childId: string;
  latestHeightCm: number | null;
  latestWeightKg: number | null;
}) {
  const router = useRouter();
  const [heightCm, setHeightCm] = useState(latestHeightCm != null ? String(latestHeightCm) : "");
  const [weightKg, setWeightKg] = useState(latestWeightKg != null ? String(latestWeightKg) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save() {
    const h = Number(heightCm);
    const w = Number(weightKg);
    if (!Number.isFinite(h) || h <= 0 || !Number.isFinite(w) || w <= 0) {
      setError("Nhập chiều cao và cân nặng hợp lệ.");
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/growth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, heightCm: h, weightKg: w }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Không lưu được.");
        return;
      }
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-[20px] bg-white p-4 shadow-md">
      <p className="text-[11.5px] font-bold uppercase tracking-wide text-muted">Nhập chiều cao / cân nặng hôm nay</p>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-bold text-muted">Chiều cao (cm)</label>
          <input
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            type="number"
            inputMode="decimal"
            step="0.1"
            placeholder="vd: 120.5"
            className="w-full rounded-xl border-2 border-divider px-3 py-2 text-[13.5px] font-semibold focus:border-blue focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-bold text-muted">Cân nặng (kg)</label>
          <input
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            type="number"
            inputMode="decimal"
            step="0.1"
            placeholder="vd: 25.5"
            className="w-full rounded-xl border-2 border-divider px-3 py-2 text-[13.5px] font-semibold focus:border-blue focus:outline-none"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          disabled={saving}
          onClick={save}
          className="flex items-center gap-1.5 rounded-full bg-divider px-3 py-1.5 text-[11.5px] font-extrabold text-blue disabled:opacity-70"
        >
          {saving && <Spinner size={12} />}
          {saving ? "Đang lưu…" : "Lưu số đo hôm nay"}
        </button>
        {saved && <span className="text-[11.5px] font-extrabold text-green">Đã lưu ✓</span>}
      </div>
      {error && <p className="text-[12.5px] font-semibold text-coral-text">{error}</p>}
    </div>
  );
}
