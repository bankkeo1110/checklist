"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";

type Item = { id: string; label: string };

export default function WakeupChecklist({
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
      const res = await fetch("/api/wakeup-logs/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wakeupItemId: item.id, checked: next }),
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
    return <p className="text-sm font-semibold text-muted">Chưa có mục nào trong checklist.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => {
        const checked = !!merged[item.id];
        return (
          <li key={item.id}>
            <button
              onClick={() => toggle(item)}
              disabled={pendingId === item.id}
              className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left shadow-md disabled:opacity-60"
            >
              <span
                className={`flex h-[22px] w-[22px] flex-none items-center justify-center rounded-lg border-2 ${
                  checked ? "border-orange bg-orange" : "border-[#e4e1e8]"
                }`}
              >
                {checked && <Check size={13} strokeWidth={3} className="text-white" />}
              </span>
              <span className={`text-[14.5px] font-bold ${checked ? "text-muted line-through" : ""}`}>
                {item.label}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
