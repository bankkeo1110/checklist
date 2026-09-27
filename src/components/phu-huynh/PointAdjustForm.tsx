"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Spinner from "@/components/Spinner";

export default function PointAdjustForm({ childId, currentTotal }: { childId: string; currentTotal: number }) {
  const router = useRouter();
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function applyAdjustment(deltaNum: number, reasonText: string) {
    const res = await fetch("/api/points/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId, delta: deltaNum, reason: reasonText }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Không thực hiện được.");
      return false;
    }
    router.refresh();
    return true;
  }

  async function submit() {
    const deltaNum = Number(delta);
    if (!Number.isInteger(deltaNum) || deltaNum === 0 || !reason.trim()) {
      setError("Nhập số điểm (khác 0) và lý do.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const ok = await applyAdjustment(deltaNum, reason.trim());
      if (ok) {
        setDelta("");
        setReason("");
      }
    } finally {
      setSaving(false);
    }
  }

  async function resetToZero() {
    if (currentTotal === 0) return;
    if (!window.confirm(`Đưa tổng điểm về 0? (hiện đang là ${currentTotal})`)) return;
    setResetting(true);
    setError(null);
    try {
      await applyAdjustment(-currentTotal, "Reset điểm về 0");
    } finally {
      setResetting(false);
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
      <div className="flex flex-wrap items-center gap-2">
        <button
          disabled={saving}
          onClick={submit}
          className="flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-[13.5px] font-extrabold text-white disabled:opacity-70"
          style={{ background: "linear-gradient(135deg,#B983FF,#9C6BE0)" }}
        >
          {saving && <Spinner size={14} />}
          Áp dụng
        </button>
        <button
          disabled={resetting || currentTotal === 0}
          onClick={resetToZero}
          className="flex items-center gap-1.5 rounded-2xl bg-divider px-4 py-2.5 text-[13.5px] font-extrabold text-muted disabled:opacity-50"
        >
          {resetting && <Spinner size={14} />}
          Reset về 0
        </button>
      </div>
      {error && <p className="text-sm font-semibold text-coral-text">{error}</p>}
    </div>
  );
}
