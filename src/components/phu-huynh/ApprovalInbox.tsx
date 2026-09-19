"use client";

import { useRouter } from "next/navigation";
import { useState, type CSSProperties } from "react";
import PersonIcon from "@/components/PersonIcon";
import Stars from "@/components/Stars";
import Corners from "@/components/Corners";

type Item = {
  id: string;
  taskTitle: string;
  points: number;
  childName: string;
  childLabel: string;
};

type Particle = { style: CSSProperties };

function makeConfetti(): Particle[] {
  const shades = [300, 400, 500, 700];
  return Array.from({ length: 10 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 26 + Math.random() * 38;
    const shade = shades[Math.floor(Math.random() * shades.length)];
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - 16;
    const rot = Math.round(Math.random() * 360);
    const delay = Math.round(Math.random() * 90);
    return {
      style: {
        "--dx": `${dx.toFixed(1)}px`,
        "--dy": `${dy.toFixed(1)}px`,
        "--rot": `${rot}deg`,
        animationDelay: `${delay}ms`,
        background: `var(--color-accent-${shade})`,
      } as CSSProperties,
    };
  });
}

export default function ApprovalInbox({ items }: { items: Item[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confettiId, setConfettiId] = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);

  async function review(id: string, action: "approve" | "reject") {
    setPendingId(id);
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
    }
  }

  if (items.length === 0) {
    return (
      <div className="blueprint border border-divider bg-surface p-10 text-center text-ink/50">
        <Corners />
        Đã duyệt hết rồi! 🎉
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.id} className="blueprint relative flex flex-col gap-3 border border-divider bg-surface p-4">
          <Corners />
          <div className="flex items-center gap-3">
            <span className="flex h-[30px] w-[30px] flex-none items-center justify-center border border-divider">
              <PersonIcon name={item.childName} size={16} strokeWidth={1.5} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {item.childLabel} — {item.taskTitle}
              </p>
              <p className="flex items-center gap-1 text-[11.5px] text-ink/60">
                hôm nay · <Stars count={item.points} size={11} />
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              disabled={pendingId === item.id}
              onClick={() => review(item.id, "reject")}
              className="blueprint flex-1 border border-divider py-2 text-sm font-semibold disabled:opacity-50"
            >
              <Corners />
              Từ chối
            </button>
            <button
              disabled={pendingId === item.id}
              onClick={() => review(item.id, "approve")}
              className="blueprint flex-1 border border-accent-700 bg-accent-700 py-2 text-sm font-semibold text-canvas disabled:opacity-50"
            >
              <Corners />
              Duyệt
            </button>
          </div>
          {confettiId === item.id &&
            particles.map((p, i) => (
              <span
                key={i}
                style={p.style}
                className="absolute right-[24px] bottom-[14px] h-[5px] w-[5px] animate-[confetti-fly_0.85s_ease-out_forwards]"
              />
            ))}
        </li>
      ))}
    </ul>
  );
}
