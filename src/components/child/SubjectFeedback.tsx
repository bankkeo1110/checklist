"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";
import Spinner from "@/components/Spinner";
import Stars from "@/components/Stars";

type Item = { id: string; label: string; points: number };

export default function SubjectFeedback({
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
      const res = await fetch("/api/subject-logs/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectItemId: item.id, checked: next }),
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
    return <p className="text-sm font-semibold text-muted">Chưa có môn nào trong nhận xét tuần này.</p>;
  }

  return (
    <ul className="grid grid-cols-2 gap-2">
      {items.map((item) => {
        const checked = !!merged[item.id];
        const pending = pendingId === item.id;
        return (
          <li key={item.id}>
            <button
              onClick={() => toggle(item)}
              disabled={pending}
              className="flex w-full items-center gap-2.5 rounded-2xl bg-white px-3.5 py-3 text-left shadow-md disabled:opacity-80"
            >
              <span
                className={`flex h-[22px] w-[22px] flex-none items-center justify-center rounded-lg border-2 ${
                  checked ? "border-purple bg-purple" : "border-[#e4e1e8]"
                }`}
              >
                {pending ? (
                  <Spinner size={12} className={checked ? "text-white" : "text-muted"} />
                ) : (
                  checked && <Check size={13} strokeWidth={3} className="text-white" />
                )}
              </span>
              <span className={`min-w-0 flex-1 truncate text-[13.5px] font-bold ${checked ? "text-muted line-through" : ""}`}>
                {item.label}
              </span>
              <Stars count={item.points} size={11} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
