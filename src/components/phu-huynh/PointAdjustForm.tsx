"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Spinner from "@/components/Spinner";

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
    <div className="flex flex-col gap-2.5 rounded-[20px] bg-white p-4 shadow-md">
      <p className="text-[11.5px] font-bold uppercase tracking-wide text-muted">Điều chỉnh điểm thủ công</p>
      <div className="flex gap-2">
        <input
          value={delta}
          onChange={(e) => setDelta(e.target.value)}
          type="number"
          placeholder="+/- điểm"
          className="w-24 rounded-xl border-2 border-divider px-3 py-2 text-[13.5px] font-semibold focus:border-blue focus:outline-none"
        />
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Lý do"
          className="flex-1 rounded-xl border-2 border-divider px-3 py-2 text-[13.5px] font-semibold focus:border-blue focus:outline-none"
        />
      </div>
      <button
        disabled={saving}
        onClick={submit}
        className="flex items-center gap-1.5 self-start rounded-2xl px-4 py-2.5 text-[13.5px] font-extrabold text-white disabled:opacity-70"
        style={{ background: "linear-gradient(135deg,#B983FF,#9C6BE0)" }}
      >
        {saving && <Spinner size={14} />}
        Áp dụng
      </button>
      {error && <p className="text-sm font-semibold text-coral-text">{error}</p>}
    </div>
  );
}
