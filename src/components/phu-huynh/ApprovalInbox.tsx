"use client";

import { useRouter } from "next/navigation";
import { useState, type CSSProperties } from "react";
import PersonBadge from "@/components/PersonBadge";
import Stars from "@/components/Stars";
import Spinner from "@/components/Spinner";
import { dayOfMonth, todayDateStr, weekdayLabel } from "@/lib/date";

type Item = {
  id: string;
  taskTitle: string;
  points: number;
  childName: string;
  childLabel: string;
  /** Which calendar day the task instance is for (YYYY-MM-DD). */
  date: string;
  /** When the child submitted/claimed it. */
  claimedAt: string | null;
};

const VN_TIME_ZONE = "Asia/Ho_Chi_Minh";
const CLAIMED_TIME_FORMAT = new Intl.DateTimeFormat("vi-VN", { timeZone: VN_TIME_ZONE, hour: "2-digit", minute: "2-digit" });
const CLAIMED_DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: VN_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function claimedLabel(claimedAt: string | null): string {
  if (!claimedAt) return "";
  const claimed = new Date(claimedAt);
  const claimedDate = CLAIMED_DATE_FORMAT.format(claimed);
  const time = CLAIMED_TIME_FORMAT.format(claimed);
  if (claimedDate === todayDateStr()) return `nộp hôm nay lúc ${time}`;
  return `nộp ${dayOfMonth(claimedDate)}/${Number(claimedDate.slice(5, 7))} lúc ${time}`;
}

type Particle = { style: CSSProperties };

const CONFETTI_COLORS = ["#FF6B6B", "#4D96FF", "#FFC93C", "#6BCB77", "#B983FF"];

function makeConfetti(): Particle[] {
  return Array.from({ length: 12 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 28 + Math.random() * 42;
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - 18;
    const rot = Math.round(Math.random() * 360);
    const delay = Math.round(Math.random() * 90);
    return {
      style: {
        "--dx": `${dx.toFixed(1)}px`,
        "--dy": `${dy.toFixed(1)}px`,
        "--rot": `${rot}deg`,
        animationDelay: `${delay}ms`,
        background: color,
      } as CSSProperties,
    };
  });
}

export default function ApprovalInbox({ items }: { items: Item[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"approve" | "reject" | null>(null);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [confettiId, setConfettiId] = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [bulkBusy, setBulkBusy] = useState<"approve" | "reject" | null>(null);
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
  const [bulkReason, setBulkReason] = useState("");
  const [bulkReasonError, setBulkReasonError] = useState<string | null>(null);

  function openReject(id: string) {
    setFeedbackId(id);
    setFeedback("");
    setFeedbackError(null);
  }

  async function bulkApprove() {
    setBulkBusy("approve");
    try {
      for (const item of items) {
        await fetch(`/api/task-instances/${item.id}/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "approve" }),
        });
      }
      router.refresh();
    } finally {
      setBulkBusy(null);
    }
  }

  function openBulkReject() {
    setBulkRejectOpen(true);
    setBulkReason("");
    setBulkReasonError(null);
  }

  async function confirmBulkReject() {
    setBulkBusy("reject");
    try {
      for (const item of items) {
        const res = await fetch(`/api/task-instances/${item.id}/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reject", note: bulkReason.trim() || undefined }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setBulkReasonError(data?.error ?? "Không thực hiện được.");
          return;
        }
      }
      setBulkRejectOpen(false);
      setBulkReason("");
      router.refresh();
    } finally {
      setBulkBusy(null);
    }
  }

  async function approve(id: string) {
    setPendingId(id);
    setPendingAction("approve");
    setParticles(makeConfetti());
    setConfettiId(id);
    setTimeout(() => setConfettiId(null), 950);
    try {
      const res = await fetch(`/api/task-instances/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (res.ok) router.refresh();
    } finally {
      setPendingId(null);
      setPendingAction(null);
    }
  }

  async function confirmReject(id: string) {
    setPendingId(id);
    setPendingAction("reject");
    try {
      const res = await fetch(`/api/task-instances/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", note: feedback.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        setFeedbackError(data.error ?? "Không thực hiện được.");
        return;
      }
      router.refresh();
      setFeedbackId(null);
      setFeedback("");
    } finally {
      setPendingId(null);
      setPendingAction(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[22px] bg-white p-9 text-center shadow-md">
        <p className="font-display text-[15px] font-bold">Đã duyệt hết rồi! 🎉</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2.5 rounded-[22px] bg-white p-3.5 shadow-md">
        <p className="text-[11.5px] font-bold uppercase tracking-wide text-muted">{items.length} mục đang chờ</p>
        <div className="flex gap-2.5">
          <button
            disabled={bulkBusy !== null}
            onClick={openBulkReject}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-divider py-2.5 text-[13.5px] font-extrabold text-muted disabled:opacity-70"
          >
            {bulkBusy === "reject" && <Spinner size={16} />}
            Từ chối tất cả
          </button>
          <button
            disabled={bulkBusy !== null}
            onClick={bulkApprove}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2.5 text-[13.5px] font-extrabold text-white shadow-md disabled:opacity-70"
            style={{ background: "linear-gradient(135deg,#6BCB77,#4FB35B)" }}
          >
            {bulkBusy === "approve" && <Spinner size={16} />}
            Duyệt tất cả ✓
          </button>
        </div>
        {bulkRejectOpen && (
          <div className="flex flex-col gap-2 rounded-2xl bg-divider p-3">
            <label className="text-xs font-bold text-muted" htmlFor="bulk-feedback">
              Lý do từ chối tất cả (không bắt buộc)
            </label>
            <textarea
              id="bulk-feedback"
              value={bulkReason}
              onChange={(event) => {
                setBulkReason(event.target.value);
                if (bulkReasonError) setBulkReasonError(null);
              }}
              placeholder="Viết lý do từ chối chung cho tất cả mục..."
              rows={2}
              className="resize-none rounded-xl border-2 border-white bg-white px-3 py-2 text-sm font-semibold focus:border-blue focus:outline-none"
            />
            {bulkReasonError && <p className="text-[12.5px] font-semibold text-coral-text">{bulkReasonError}</p>}
            <div className="flex gap-2">
              <button
                disabled={bulkBusy !== null}
                onClick={confirmBulkReject}
                className="rounded-xl bg-blue px-4 py-2 text-[13px] font-extrabold text-white disabled:opacity-70"
              >
                {bulkBusy === "reject" ? <Spinner size={15} /> : "OK — Từ chối tất cả"}
              </button>
              <button
                disabled={bulkBusy !== null}
                onClick={() => setBulkRejectOpen(false)}
                className="rounded-xl bg-white px-4 py-2 text-[13px] font-extrabold text-muted disabled:opacity-50"
              >
                Huỷ
              </button>
            </div>
          </div>
        )}
      </div>

      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.id} className="relative flex flex-col gap-3 rounded-[22px] bg-white p-4 shadow-md">
            <div className="flex items-center gap-2.5">
              <PersonBadge name={item.childName} size={36} iconSize={18} radius={12} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">
                  {item.childLabel} — {item.taskTitle}
                </p>
                <p className="flex flex-wrap items-center gap-1 text-[11.5px] font-semibold text-muted">
                  {weekdayLabel(item.date)} {dayOfMonth(item.date)}/{Number(item.date.slice(5, 7))}
                  {item.claimedAt && <> · {claimedLabel(item.claimedAt)}</>} · <Stars count={item.points} size={12} />
                </p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button
                disabled={pendingId === item.id || bulkBusy !== null}
                onClick={() => openReject(item.id)}
                className="flex flex-1 items-center justify-center rounded-2xl bg-divider py-2.5 text-[13.5px] font-extrabold text-muted disabled:opacity-70"
              >
                {pendingId === item.id && pendingAction === "reject" ? <Spinner size={16} /> : "Từ chối"}
              </button>
              <button
                disabled={pendingId === item.id || bulkBusy !== null}
                onClick={() => approve(item.id)}
                className="flex flex-1 items-center justify-center rounded-2xl py-2.5 text-[13.5px] font-extrabold text-white shadow-md disabled:opacity-70"
                style={{ background: "linear-gradient(135deg,#6BCB77,#4FB35B)" }}
              >
                {pendingId === item.id && pendingAction === "approve" ? <Spinner size={16} /> : "Duyệt ✓"}
              </button>
            </div>
            {feedbackId === item.id && (
              <div className="flex flex-col gap-2 rounded-2xl bg-divider p-3">
                <label className="text-xs font-bold text-muted" htmlFor={`feedback-${item.id}`}>
                  Lý do từ chối (không bắt buộc)
                </label>
                <textarea
                  id={`feedback-${item.id}`}
                  value={feedback}
                  onChange={(event) => {
                    setFeedback(event.target.value);
                    if (feedbackError) setFeedbackError(null);
                  }}
                  placeholder="Viết lý do từ chối cho con..."
                  rows={2}
                  className="resize-none rounded-xl border-2 border-white bg-white px-3 py-2 text-sm font-semibold focus:border-blue focus:outline-none"
                />
                {feedbackError && <p className="text-[12.5px] font-semibold text-coral-text">{feedbackError}</p>}
                <button
                  disabled={pendingId === item.id}
                  onClick={() => confirmReject(item.id)}
                  className="rounded-xl bg-blue py-2 text-[13px] font-extrabold text-white disabled:opacity-70"
                >
                  {pendingId === item.id ? <Spinner size={15} /> : "OK — Từ chối"}
                </button>
              </div>
            )}
            {confettiId === item.id &&
              particles.map((p, i) => (
                <span
                  key={i}
                  style={p.style}
                  className="absolute right-[28px] bottom-[16px] h-1.5 w-1.5 rounded-sm animate-[confetti-fly_0.9s_ease-out_forwards]"
                />
              ))}
          </li>
        ))}
      </ul>
    </div>
  );
}
