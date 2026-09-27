"use client";

import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";
import { Check, X, Clock } from "lucide-react";
import { weekdayLabel } from "@/lib/date";
import Stars from "@/components/Stars";
import Spinner from "@/components/Spinner";

type Task = { id: string; title: string; points: number };
type Cell = { id: string; status: string };

// Checkbox-styled status square: bé bấm ô trống để xin duyệt (CLAIMED), ba mẹ
// duyệt/từ chối mới ra kết quả cuối — bé không tự bỏ tích được sau khi bấm.
function StatusCell({ status }: { status: string }) {
  if (status === "APPROVED") {
    return (
      <span className="flex h-[38px] w-[38px] items-center justify-center rounded-lg border-2 border-green bg-green">
        <Check size={17} strokeWidth={2.5} className="text-white" />
      </span>
    );
  }
  if (status === "CLAIMED") {
    return (
      <span className="flex h-[38px] w-[38px] items-center justify-center rounded-lg border-2 border-orange bg-[#fff1e2] text-orange">
        <Clock size={15} strokeWidth={1.8} />
      </span>
    );
  }
  if (status === "REJECTED") {
    return (
      <span
        className="flex h-[38px] w-[38px] items-center justify-center rounded-lg border-2"
        style={{ borderColor: "#e7a79e", background: "#fbedec" }}
      >
        <X size={14} strokeWidth={2} style={{ color: "#c4736b" }} />
      </span>
    );
  }
  return (
    <span className="flex h-[38px] w-[38px] items-center justify-center rounded-lg bg-[#f7f5f9] text-[14px] text-[#c7c3cc]">
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
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [optimisticClaims, setOptimisticClaims] = useState<Record<string, boolean>>({});
  const [burstTaskId, setBurstTaskId] = useState<string | null>(null);

  async function claim(taskId: string, date: string) {
    const key = `${taskId}:${date}`;
    setPendingKey(key);
    // Bật ngay đồng hồ chờ duyệt + một dòng nhắn nhỏ, thay vì chờ round-trip
    // API rồi router.refresh() mới thấy gì đó đổi — bé bấm cái là thấy phản
    // hồi liền. Không hiện "+star" ở đây vì điểm chỉ cộng sau khi ba mẹ duyệt.
    setOptimisticClaims((o) => ({ ...o, [key]: true }));
    setBurstTaskId(taskId);
    setTimeout(() => setBurstTaskId((b) => (b === taskId ? null : b)), 1000);
    try {
      const res = await fetch("/api/task-instances/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, date }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        setOptimisticClaims((o) => ({ ...o, [key]: false }));
      }
    } finally {
      setPendingKey(null);
    }
  }

  if (tasks.length === 0) {
    return <p className="text-sm font-semibold text-muted">Chưa có nhiệm vụ nào được giao.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-[22px] bg-white p-3.5 shadow-md">
      {/* One shared grid for the header row and every task row, so columns
          always line up. The name column sizes to the longest task title
          (max-content) instead of a fixed fraction, so titles never get cut
          off; the day columns keep a floor wide enough for a 38px checkbox. */}
      <div className="grid min-w-[560px] grid-cols-[max-content_repeat(7,minmax(38px,1fr))] gap-x-2 gap-y-2">
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
            <div className="relative flex items-center gap-1.5 whitespace-nowrap pr-2 text-[12.5px] font-bold">
              <span>{task.title}</span>
              <Stars count={task.points} size={11} />
              {burstTaskId === task.id && (
                <span className="pointer-events-none absolute -top-4 left-0 whitespace-nowrap text-[11.5px] font-extrabold text-orange animate-[starBurst_1s_ease-out_forwards]">
                  Đã gửi, chờ duyệt ⏳
                </span>
              )}
            </div>
            {dates.map((d) => {
              const key = `${task.id}:${d}`;
              const cell = cellsByTask[task.id]?.[d];
              const isFuture = d > today;
              const isPending = pendingKey === key;

              // Bất kỳ ngày nào trong tuần hiện tại (trừ ngày tương lai) đều
              // check được, kể cả nhiệm vụ vừa mới thêm giữa tuần — nhiệm vụ
              // đã thuộc kế hoạch tuần này thì áp dụng cho cả tuần đó.
              if (isFuture) {
                return (
                  <div key={`${task.id}-${d}`} className="flex justify-center">
                    <span className="flex h-[38px] w-[38px] items-center justify-center rounded-lg bg-[#f7f5f9] text-[14px] text-[#e4e1e8]">
                      ·
                    </span>
                  </div>
                );
              }

              const status = optimisticClaims[key] ? "CLAIMED" : cell?.status;
              if (status === "CLAIMED" || status === "APPROVED") {
                return (
                  <div key={`${task.id}-${d}`} className="flex justify-center">
                    <StatusCell status={status} />
                  </div>
                );
              }

              // Bé check được cho hôm nay và các ngày đã qua trong tuần (kể
              // cả ngày đã bị tự động đánh "chưa check-in" hoặc bị từ chối) —
              // bấm lại là gửi xin duyệt lại từ đầu. Viền màu nhạt nhắc lại
              // vì sao ô này vẫn trống, để bé không tưởng nhầm là chưa từng bấm.
              const hintClass =
                status === "REJECTED"
                  ? "border-[#f3c9c2] bg-[#fdf4f2]"
                  : status === "MISSED"
                    ? "border-[#e9e6ed] bg-[#f9f8fa]"
                    : "border-[#e4e1e8] bg-white";
              return (
                <div key={`${task.id}-${d}`} className="flex justify-center">
                  <button
                    disabled={isPending}
                    onClick={() => claim(task.id, d)}
                    aria-label={`Đánh dấu xong: ${task.title} (${weekdayLabel(d)})`}
                    className={`flex h-[38px] w-[38px] items-center justify-center rounded-lg border-2 transition hover:border-orange disabled:opacity-70 ${hintClass}`}
                  >
                    {isPending && <Spinner size={15} className="text-orange" />}
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
