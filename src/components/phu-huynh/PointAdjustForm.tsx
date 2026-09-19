"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PointAdjustForm({ childId }: { childId: string }) {
  const router = useRouter();
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const deltaNum = Number(delta);
    if (!Number.isInteger(deltaNum) || deltaNum === 0 || !reason.trim()) {
      setError("Nhập số điểm (khác 0) và lý do.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/points/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, delta: deltaNum, reason: reason.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Không thực hiện được.");
        return;
      }
      setDelta("");
      setReason("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-2 text-sm font-semibold text-slate-600">Điều chỉnh điểm thủ công</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={delta}
          onChange={(e) => setDelta(e.target.value)}
          type="number"
          placeholder="+/- điểm"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm sm:w-28"
        />
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Lý do"
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <button
          disabled={saving}
          onClick={submit}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Áp dụng
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
