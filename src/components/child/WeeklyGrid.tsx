"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, X, Clock, Plus } from "lucide-react";
import { weekdayLabel, dayOfMonth } from "@/lib/date";
import Stars from "@/components/Stars";

type Task = { id: string; title: string; points: number; createdAtDate: string };
type Cell = { id: string; status: string };

function StatusGlyph({ status }: { status: string }) {
  if (status === "APPROVED") {
    return (
      <span className="inline-flex h-9 w-9 items-center justify-center bg-accent-700 text-canvas">
        <Check size={16} strokeWidth={2} />
      </span>
    );
  }
  if (status === "CLAIMED") {
    return (
      <span className="inline-flex h-9 w-9 items-center justify-center border border-accent-700 text-accent-700">
        <Clock size={16} strokeWidth={1.5} />
      </span>
    );
  }
  if (status === "REJECTED") {
    return (
      <span className="inline-flex h-9 w-9 items-center justify-center border border-divider text-neutral-800">
        <X size={14} strokeWidth={1.5} />
      </span>
    );
  }
  return <span className="inline-flex h-9 w-9 items-center justify-center text-neutral-500">—</span>;
}

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
    return <p className="text-sm text-ink/50">Chưa có nhiệm vụ nào được giao.</p>;
  }

  return (
    <div className="overflow-x-auto border border-divider bg-surface">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-surface p-3 text-left text-xs font-semibold text-ink/60" />
            {dates.map((d) => (
              <th
                key={d}
                className={`p-2 text-center font-heading text-xs font-semibold ${
                  d === today ? "text-accent-700" : "text-ink/50"
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
            <tr key={task.id} className="border-t border-divider">
              <td className="sticky left-0 z-10 max-w-[160px] bg-surface p-3 align-top">
                <p className="font-medium">{task.title}</p>
                <Stars count={task.points} size={11} />
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
                        <StatusGlyph status={status} />
                      </td>
                    );
                  }
                  return (
                    <td key={d} className="p-2 text-center">
                      <button
                        disabled={pendingTaskId === task.id}
                        onClick={() => claim(task.id)}
                        className="inline-flex h-9 w-9 items-center justify-center border border-accent-700 text-accent-700 active:scale-90 disabled:opacity-50"
                        aria-label={`Đánh dấu xong: ${task.title}`}
                      >
                        <Plus size={16} strokeWidth={1.5} />
                      </button>
                    </td>
                  );
                }

                if (isFuture || d < task.createdAtDate) {
                  return (
                    <td key={d} className="p-2 text-center">
                      <span className="inline-flex h-9 w-9 items-center justify-center text-neutral-400">·</span>
                    </td>
                  );
                }

                return (
                  <td key={d} className="p-2 text-center">
                    <StatusGlyph status={cell?.status ?? "MISSED"} />
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
