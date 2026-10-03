"use client";

import { useState } from "react";
import Link from "next/link";
import { Key } from "lucide-react";
import PersonBadge from "@/components/PersonBadge";
import Spinner from "@/components/Spinner";
import { personTheme } from "@/lib/personTheme";
import { DEFAULT_PARENT_PIN } from "@/lib/pin";

type Parent = { id: string; name: string; label: string };

export default function ResetParentPinForm({ parents }: { parents: Parent[] }) {
  const [selected, setSelected] = useState<Parent | null>(null);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function confirmReset() {
    if (!selected) return;
    setResetting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-parent-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId: selected.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Không reset được.");
        return;
      }
      setDone(true);
    } finally {
      setResetting(false);
    }
  }

  if (done && selected) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <PersonBadge name={selected.name} size={64} iconSize={28} radius={20} />
        <p className="font-display text-lg font-bold">Đã reset PIN của {selected.label}</p>
        <p className="text-sm font-semibold text-muted">
          Mã PIN mới là <span className="font-display text-xl font-extrabold text-ink">{DEFAULT_PARENT_PIN}</span>
        </p>
        <p className="max-w-xs text-[12.5px] font-semibold text-coral-text">
          Đăng nhập rồi đổi lại PIN khác ngay ở trang &quot;Mã PIN&quot; nhé — ai có link này cũng reset được.
        </p>
        <Link href="/" className="mt-2 rounded-2xl bg-blue px-5 py-2.5 text-[13.5px] font-extrabold text-white">
          Về trang đăng nhập
        </Link>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <PersonBadge name={selected.name} size={64} iconSize={28} radius={20} />
        <p className="font-display text-lg font-bold">Reset PIN của {selected.label} về mặc định?</p>
        <p className="max-w-xs text-[12.5px] font-semibold text-muted">
          Mã PIN sẽ đổi thành <span className="font-bold text-ink">{DEFAULT_PARENT_PIN}</span>, PIN cũ sẽ không dùng được nữa.
        </p>
        {error && <p className="text-[12.5px] font-semibold text-coral-text">{error}</p>}
        <div className="mt-1 flex gap-2.5">
          <button
            disabled={resetting}
            onClick={confirmReset}
            className="flex items-center gap-1.5 rounded-2xl bg-coral px-5 py-2.5 text-[13.5px] font-extrabold text-white disabled:opacity-70"
          >
            {resetting && <Spinner size={14} />}
            Xác nhận reset
          </button>
          <button
            disabled={resetting}
            onClick={() => setSelected(null)}
            className="rounded-2xl bg-divider px-5 py-2.5 text-[13.5px] font-extrabold text-muted disabled:opacity-50"
          >
            Huỷ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <span
          className="mb-1 flex h-14 w-14 items-center justify-center rounded-[20px] text-white shadow-lg"
          style={{ background: "linear-gradient(145deg,#FF9F45,#FF6B6B)" }}
        >
          <Key size={26} strokeWidth={2} />
        </span>
        <h1 className="font-display text-xl font-extrabold">Reset mã PIN phụ huynh</h1>
        <p className="max-w-xs text-[13px] font-semibold text-muted">Chọn phụ huynh cần reset PIN về mặc định.</p>
      </div>
      <div className="flex gap-3.5">
        {parents.map((p) => {
          const theme = personTheme(p.name);
          return (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className="flex flex-col items-center gap-2.5 rounded-3xl bg-white px-5 py-6 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.97]"
            >
              <PersonBadge name={p.name} size={56} iconSize={26} radius={18} />
              <span className="font-display text-[15px] font-bold">{p.label}</span>
              <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ background: theme.tint, color: theme.text }}>
                Ba / Mẹ
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
