"use client";

import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";
import { Check, X, Clock, Plus } from "lucide-react";
import { weekdayLabel } from "@/lib/date";
import Stars from "@/components/Stars";
import Spinner from "@/components/Spinner";

type Task = { id: string; title: string; points: number; createdAtDate: string };
type Cell = { id: string; status: string };

function StatusCell({ status }: { status: string }) {
  if (status === "APPROVED") {
    return (
      <span className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-green">
        <Check size={17} strokeWidth={2.5} className="text-white" />
      </span>
    );
  }
  if (status === "CLAIMED") {
    return (
      <span className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-blue-tint">
        <Clock size={15} strokeWidth={1.8} className="text-blue" />
      </span>
    );
  }
  if (status === "REJECTED") {
    return (
      <span className="flex h-[38px] w-[38px] items-center justify-center rounded-xl" style={{ background: "#fbedec" }}>
        <X size={14} strokeWidth={2} style={{ color: "#c4736b" }} />
      </span>
    );
  }
  return (
    <span className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-[#f7f5f9] text-[14px] text-[#c7c3cc]">
      ·
    </span>
  );
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
    return <p className="text-sm font-semibold text-muted">Chưa có nhiệm vụ nào được giao.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-[22px] bg-white p-3.5 shadow-md">
      {/* One shared grid for the header row and every task row, so columns
          always line up regardless of how long a task title is — a row-per-grid
          approach lets a long title's column grow independently of the others. */}
      <div className="grid min-w-[380px] grid-cols-[1.3fr_repeat(7,1fr)] gap-x-1 gap-y-2">
        <div />
        {dates.map((d) => (
          <div
            key={d}
            className={`text-center font-display text-[11.5px] font-bold ${
              d === today ? "text-orange" : "text-muted"
            }`}
          >
            {weekdayLabel(d)}
          </div>
        ))}

        {tasks.map((task) => (
          <Fragment key={task.id}>
            <div className="flex min-w-0 items-center gap-1 pr-1 text-[12.5px] font-bold">
              <span className="min-w-0 truncate">{task.title}</span>
              <Stars count={task.points} size={11} />
            </div>
            {dates.map((d) => {
              const cell = cellsByTask[task.id]?.[d];
              const isToday = d === today;
              const isFuture = d > today;
              const isPending = pendingTaskId === task.id;

              if (isToday) {
                const status = cell?.status;
                if (status === "CLAIMED" || status === "APPROVED") {
                  return (
                    <div key={`${task.id}-${d}`} className="flex justify-center">
                      <StatusCell status={status} />
                    </div>
                  );
                }
                return (
                  <div key={`${task.id}-${d}`} className="flex justify-center">
                    <button
                      disabled={isPending}
                      onClick={() => claim(task.id)}
                      aria-label={`Đánh dấu xong: ${task.title}`}
                      className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-[#fff1e2] text-orange transition hover:bg-[#ffe4c4] disabled:opacity-70"
                    >
                      {isPending ? <Spinner size={16} /> : <Plus size={18} strokeWidth={2.4} />}
                    </button>
                  </div>
                );
              }

              if (isFuture || d < task.createdAtDate) {
                return (
                  <div key={`${task.id}-${d}`} className="flex justify-center">
                    <span className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-[#f7f5f9] text-[14px] text-[#e4e1e8]">
                      ·
                    </span>
                  </div>
                );
              }

              return (
                <div key={`${task.id}-${d}`} className="flex justify-center">
                  <StatusCell status={cell?.status ?? "MISSED"} />
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
