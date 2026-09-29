"use client";

import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";
import { Check } from "lucide-react";
import { weekdayLabel } from "@/lib/date";
import Stars from "@/components/Stars";
import Spinner from "@/components/Spinner";

type Item = { id: string; label: string; points: number };
type Accent = "orange" | "blue";

// Same weekly-grid shape as "Nhiệm vụ tuần", but these are self-check items
// (checklist buổi sáng/tối) — checking grants points immediately, no parent
// approval, and once checked a day is locked (no unchecking back and forth).
export default function SelfCheckGrid({
  items,
  dates,
  today,
  checkedMap,
  toggleUrl,
  itemIdField,
  accent,
}: {
  items: Item[];
  dates: string[];
  today: string;
  checkedMap: Record<string, Record<string, boolean>>;
  toggleUrl: string;
  itemIdField: string;
  accent: Accent;
}) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [optimisticChecked, setOptimisticChecked] = useState<Record<string, boolean>>({});
  const [burstItemId, setBurstItemId] = useState<string | null>(null);

  const border = accent === "orange" ? "border-orange" : "border-blue";
  const bg = accent === "orange" ? "bg-orange" : "bg-blue";
  const text = accent === "orange" ? "text-orange" : "text-blue";
  const hoverBorder = accent === "orange" ? "hover:border-orange" : "hover:border-blue";

  async function check(itemId: string, date: string) {
    const key = `${itemId}:${date}`;
    setPendingKey(key);
    setOptimisticChecked((o) => ({ ...o, [key]: true }));
    setBurstItemId(itemId);
    setTimeout(() => setBurstItemId((b) => (b === itemId ? null : b)), 1000);
    try {
      const res = await fetch(toggleUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [itemIdField]: itemId, date, checked: true }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        setOptimisticChecked((o) => ({ ...o, [key]: false }));
      }
    } finally {
      setPendingKey(null);
    }
  }

  if (items.length === 0) {
    return <p className="text-sm font-semibold text-muted">Chưa có mục nào trong checklist.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-[22px] bg-white p-3.5 shadow-md">
      <div className="grid min-w-[560px] grid-cols-[max-content_repeat(7,minmax(38px,1fr))] gap-x-2 gap-y-2">
        <div />
        {dates.map((d) => (
          <div
            key={d}
            className={`text-center font-display text-[11.5px] font-bold ${d === today ? text : "text-muted"}`}
          >
            {weekdayLabel(d)}
          </div>
        ))}

        {items.map((item) => (
          <Fragment key={item.id}>
            <div className="relative flex items-center gap-1.5 whitespace-nowrap pr-2 text-[12.5px] font-bold">
              <span>{item.label}</span>
              <Stars count={item.points} size={11} />
              {burstItemId === item.id && (
                <span
                  className={`pointer-events-none absolute -top-4 left-0 whitespace-nowrap text-[11.5px] font-extrabold ${text} animate-[starBurst_1s_ease-out_forwards]`}
                >
                  +{item.points} ⭐
                </span>
              )}
            </div>
            {dates.map((d) => {
              const key = `${item.id}:${d}`;
              const isFuture = d > today;
              const isPending = pendingKey === key;
              const checked = optimisticChecked[key] ?? checkedMap[item.id]?.[d] ?? false;

              if (isFuture) {
                return (
                  <div key={key} className="flex justify-center">
                    <span className="flex h-[38px] w-[38px] items-center justify-center rounded-lg bg-[#f7f5f9] text-[14px] text-[#e4e1e8]">
                      ·
                    </span>
                  </div>
                );
              }

              if (checked) {
                return (
                  <div key={key} className="flex justify-center">
                    <span className={`flex h-[38px] w-[38px] items-center justify-center rounded-lg border-2 ${border} ${bg}`}>
                      <Check size={17} strokeWidth={2.5} className="text-white" />
                    </span>
                  </div>
                );
              }

              return (
                <div key={key} className="flex justify-center">
                  <button
                    disabled={isPending}
                    onClick={() => check(item.id, d)}
                    aria-label={`Đánh dấu xong: ${item.label} (${weekdayLabel(d)})`}
                    className={`flex h-[38px] w-[38px] items-center justify-center rounded-lg border-2 border-[#e4e1e8] bg-white transition ${hoverBorder} disabled:opacity-70`}
                  >
                    {isPending && <Spinner size={15} className={text} />}
                  </button>
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
