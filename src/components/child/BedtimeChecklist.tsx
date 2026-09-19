"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Item = { id: string; label: string };

export default function BedtimeChecklist({
  items,
  checkedMap,
}: {
  items: Item[];
  checkedMap: Record<string, boolean>;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});

  const merged = { ...checkedMap, ...optimistic };

  async function toggle(item: Item) {
    const next = !merged[item.id];
    setOptimistic((o) => ({ ...o, [item.id]: next }));
    setPendingId(item.id);
    try {
      const res = await fetch("/api/bedtime-logs/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bedtimeItemId: item.id, checked: next }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        setOptimistic((o) => ({ ...o, [item.id]: !next }));
      }
    } finally {
      setPendingId(null);
    }
  }

  if (items.length === 0) {
    return <p className="text-sm text-slate-400">Chưa có mục nào trong checklist.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
      {items.map((item) => {
        const checked = !!merged[item.id];
        return (
          <li key={item.id}>
            <button
              onClick={() => toggle(item)}
              disabled={pendingId === item.id}
              className="flex w-full items-center gap-3 px-4 py-3 text-left disabled:opacity-60"
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-sm font-bold ${
                  checked ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-transparent"
                }`}
              >
                ✓
              </span>
              <span className={`text-sm ${checked ? "text-slate-400 line-through" : "text-slate-700"}`}>
                {item.label}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
