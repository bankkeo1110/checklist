"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Spinner from "@/components/Spinner";

export default function WeeklyResetButton({ children }: { children: { id: string; label: string; total: number }[] }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasAnyPoints = children.some((c) => c.total !== 0);

  async function confirmReset() {
    setResetting(true);
    setError(null);
    try {
      const res = await fetch("/api/points/reset-week", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Không thực hiện được.");
        return;
      }
      setConfirming(false);
      router.refresh();
    } finally {
      setResetting(false);
    }
  }

  if (!confirming) {
    return (
      <button
        disabled={!hasAnyPoints}
        onClick={() => setConfirming(true)}
        className="flex items-center gap-1.5 self-start rounded-2xl bg-divider px-4 py-2.5 text-[13.5px] font-extrabold text-muted disabled:opacity-50"
      >
        Reset điểm tuần (cả nhà)
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border-2 border-coral-tint bg-coral-tint p-3.5">
      <p className="text-[13.5px] font-extrabold text-coral-text">Reset điểm về 0 cho tuần này — tất cả các con?</p>
      <ul className="text-[12px] font-semibold text-coral-text">
        {children.map((c) => (
          <li key={c.id}>
            {c.label}: {c.total} sao
          </li>
        ))}
      </ul>
      <p className="text-[12px] font-semibold text-coral-text">
        Số sao hiện tại của mỗi con sẽ được lưu vào lịch sử tuần này (xem lại ở Tổng kết điểm) — không đụng tới lịch sử
        nhiệm vụ/checklist, chỉ đưa tổng điểm về 0.
      </p>
      {error && <p className="text-[12px] font-semibold text-coral-text">{error}</p>}
      <div className="flex gap-2">
        <button
          disabled={resetting}
          onClick={confirmReset}
          className="flex items-center gap-1.5 rounded-xl bg-coral px-4 py-2 text-[13px] font-extrabold text-white disabled:opacity-70"
        >
          {resetting && <Spinner size={14} />}
          Xác nhận reset cho cả nhà
        </button>
        <button
          disabled={resetting}
          onClick={() => setConfirming(false)}
          className="rounded-xl bg-white px-4 py-2 text-[13px] font-extrabold text-muted disabled:opacity-50"
        >
          Huỷ
        </button>
      </div>
    </div>
  );
}
