"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";

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
    return <p className="text-sm text-ink/50">Chưa có mục nào trong checklist.</p>;
  }

  return (
    <ul className="divide-y divide-divider border border-divider bg-surface">
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
                className={`flex h-4 w-4 flex-none items-center justify-center border ${
                  checked ? "border-accent-700 bg-accent-700 text-canvas" : "border-divider text-transparent"
                }`}
              >
                <Check size={11} strokeWidth={3} />
              </span>
              <span className={`text-sm ${checked ? "text-ink/40 line-through" : ""}`}>{item.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
