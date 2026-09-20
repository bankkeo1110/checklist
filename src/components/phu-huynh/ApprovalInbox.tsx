"use client";

import { useRouter } from "next/navigation";
import { useState, type CSSProperties } from "react";
import PersonBadge from "@/components/PersonBadge";
import Stars from "@/components/Stars";
import Spinner from "@/components/Spinner";

type Item = {
  id: string;
  taskTitle: string;
  points: number;
  childName: string;
  childLabel: string;
};

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
  const [confettiId, setConfettiId] = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);

  async function review(id: string, action: "approve" | "reject") {
    setPendingId(id);
    setPendingAction(action);
    if (action === "approve") {
      setParticles(makeConfetti());
      setConfettiId(id);
      setTimeout(() => setConfettiId(null), 950);
    }
    try {
      const res = await fetch(`/api/task-instances/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) router.refresh();
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
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.id} className="relative flex flex-col gap-3 rounded-[22px] bg-white p-4 shadow-md">
          <div className="flex items-center gap-2.5">
            <PersonBadge name={item.childName} size={36} iconSize={18} radius={12} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">
                {item.childLabel} — {item.taskTitle}
              </p>
              <p className="flex items-center gap-1 text-[11.5px] font-semibold text-muted">
                hôm nay · <Stars count={item.points} size={12} />
              </p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button
              disabled={pendingId === item.id}
              onClick={() => review(item.id, "reject")}
              className="flex flex-1 items-center justify-center rounded-2xl bg-divider py-2.5 text-[13.5px] font-extrabold text-muted disabled:opacity-70"
            >
              {pendingId === item.id && pendingAction === "reject" ? <Spinner size={16} /> : "Từ chối"}
            </button>
            <button
              disabled={pendingId === item.id}
              onClick={() => review(item.id, "approve")}
              className="flex flex-1 items-center justify-center rounded-2xl py-2.5 text-[13.5px] font-extrabold text-white shadow-md disabled:opacity-70"
              style={{ background: "linear-gradient(135deg,#6BCB77,#4FB35B)" }}
            >
              {pendingId === item.id && pendingAction === "approve" ? <Spinner size={16} /> : "Duyệt ✓"}
            </button>
          </div>
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
  );
}
