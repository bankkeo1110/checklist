"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { weekdayLabel, dayOfMonth } from "@/lib/date";
import Stars from "@/components/Stars";

type Task = { id: string; title: string; points: number; createdAtDate: string };
type Cell = { id: string; status: string };

const STATUS_STYLES: Record<string, string> = {
  APPROVED: "bg-emerald-500 text-white",
  CLAIMED: "bg-amber-400 text-white",
  REJECTED: "bg-red-400 text-white",
  MISSED: "bg-slate-300 text-slate-600",
};

const STATUS_ICON: Record<string, string> = {
  APPROVED: "✓",
  CLAIMED: "…",
  REJECTED: "✕",
  MISSED: "—",
};

export default function WeeklyGrid({
  tasks,
  dates,
  today,
  cellsByTask,
}: {
  tasks: Task[];
  dates: string[];
  today: string;
  cellsByTask: Record<string, Record<string, Cell>>;
}) {
  const router = useRouter();
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);

  async function claim(taskId: string) {
    setPendingTaskId(taskId);
    try {
      const res = await fetch("/api/task-instances/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setPendingTaskId(null);
    }
  }

  if (tasks.length === 0) {
    return <p className="text-sm text-slate-400">Chưa có nhiệm vụ nào được giao.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-white p-3 text-left text-xs font-semibold text-slate-500">
              Nhiệm vụ
            </th>
            {dates.map((d) => (
              <th
                key={d}
                className={`p-2 text-center text-xs font-semibold ${
                  d === today ? "text-blue-600" : "text-slate-400"
                }`}
              >
                <div>{weekdayLabel(d)}</div>
                <div className="text-[11px] font-normal">{dayOfMonth(d)}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-t border-slate-100">
              <td className="sticky left-0 z-10 max-w-[160px] bg-white p-3 align-top">
                <p className="font-medium text-slate-700">{task.title}</p>
                <Stars count={task.points} className="text-sm" />
              </td>
              {dates.map((d) => {
                const cell = cellsByTask[task.id]?.[d];
                const isToday = d === today;
                const isFuture = d > today;

                if (isToday) {
                  const status = cell?.status;
                  if (status === "CLAIMED" || status === "APPROVED") {
                    return (
                      <td key={d} className="p-2 text-center">
                        <span
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${STATUS_STYLES[status]}`}
                        >
                          {STATUS_ICON[status]}
                        </span>
                      </td>
                    );
                  }
                  return (
                    <td key={d} className="p-2 text-center">
                      <button
                        disabled={pendingTaskId === task.id}
                        onClick={() => claim(task.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed border-blue-400 text-blue-500 active:scale-90 disabled:opacity-50"
                        aria-label={`Đánh dấu xong: ${task.title}`}
                      >
                        {pendingTaskId === task.id ? "…" : "+"}
                      </button>
                    </td>
                  );
                }

                if (isFuture || d < task.createdAtDate) {
                  return (
                    <td key={d} className="p-2 text-center">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-300">
                        ·
                      </span>
                    </td>
                  );
                }

                const status = cell?.status ?? "MISSED";
                return (
                  <td key={d} className="p-2 text-center">
                    <span
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                        STATUS_STYLES[status] ?? STATUS_STYLES.MISSED
                      }`}
                    >
                      {STATUS_ICON[status] ?? STATUS_ICON.MISSED}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
