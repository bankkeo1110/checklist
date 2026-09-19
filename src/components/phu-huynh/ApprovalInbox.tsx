"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Stars from "@/components/Stars";

type Item = {
  id: string;
  taskTitle: string;
  points: number;
  childLabel: string;
  childColor: string;
  date: string;
  claimedAt: string;
};

export default function ApprovalInbox({ items }: { items: Item[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function review(id: string, action: "approve" | "reject") {
    setPendingId(id);
    try {
      const res = await fetch(`/api/task-instances/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-400">
        Đã duyệt hết rồi! 🎉
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: item.childColor }}
            >
              {item.childLabel.charAt(0)}
            </span>
            <div>
              <p className="font-semibold text-slate-800">{item.taskTitle}</p>
              <p className="flex items-center gap-1 text-xs text-slate-500">
                {item.childLabel} · {item.date} · <Stars count={item.points} className="text-xs" />
              </p>
            </div>
          </div>
          <div className="flex gap-2 self-end sm:self-auto">
            <button
              disabled={pendingId === item.id}
              onClick={() => review(item.id, "reject")}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 disabled:opacity-50"
            >
              Từ chối
            </button>
            <button
              disabled={pendingId === item.id}
              onClick={() => review(item.id, "approve")}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Duyệt
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
