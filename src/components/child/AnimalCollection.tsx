"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock, Unlock } from "lucide-react";
import Spinner from "@/components/Spinner";
import { ANIMAL_TIERS } from "@/lib/animals";

export default function AnimalCollection({
  earnedTotal,
  openedThresholds,
}: {
  earnedTotal: number;
  openedThresholds: number[];
}) {
  const router = useRouter();
  const [optimisticOpened, setOptimisticOpened] = useState<number[]>([]);
  const [openingThreshold, setOpeningThreshold] = useState<number | null>(null);
  const [justOpened, setJustOpened] = useState<number | null>(null);

  const openedSet = new Set([...openedThresholds, ...optimisticOpened]);
  const openedTiers = ANIMAL_TIERS.filter((t) => openedSet.has(t.threshold));
  const currentOpened = openedTiers.length ? openedTiers[openedTiers.length - 1] : null;
  const nextLocked = ANIMAL_TIERS.find((t) => earnedTotal < t.threshold) ?? null;
  const pendingOpen = ANIMAL_TIERS.filter((t) => earnedTotal >= t.threshold && !openedSet.has(t.threshold));

  const base = currentOpened?.threshold ?? 0;
  const target = nextLocked?.threshold ?? base;
  const progressPct = nextLocked ? Math.min(100, Math.max(0, Math.round(((earnedTotal - base) / (target - base)) * 100))) : 100;

  async function openTier(threshold: number) {
    setOpeningThreshold(threshold);
    try {
      const res = await fetch("/api/animal-unlocks/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threshold }),
      });
      if (res.ok) {
        setOptimisticOpened((o) => [...o, threshold]);
        setJustOpened(threshold);
        setTimeout(() => setJustOpened((j) => (j === threshold ? null : j)), 600);
        router.refresh();
      }
    } finally {
      setOpeningThreshold(null);
    }
  }

  let subtitle: string;
  if (pendingOpen.length > 0) {
    const p = pendingOpen[0];
    subtitle = `🎁 Đã đủ sao để mở ${p.emoji} ${p.name}! Bấm vào ổ khóa bên dưới nhé`;
  } else if (nextLocked) {
    subtitle = `Còn ${nextLocked.threshold - earnedTotal} sao nữa để mở ${nextLocked.emoji} ${nextLocked.name}`;
  } else {
    subtitle = "Đã mở hết bộ sưu tập! 🎉";
  }

  return (
    <div className="flex flex-col gap-3.5 rounded-[22px] bg-white p-4 shadow-md">
      <div className="flex items-center gap-3">
        <span
          className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl text-[32px]"
          style={{ background: "var(--color-green-tint)" }}
        >
          {currentOpened ? currentOpened.emoji : "🥚"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[15px] font-bold">{currentOpened ? currentOpened.name : "Chưa mở con nào"}</p>
          <p className="text-[12.5px] font-semibold text-muted">{subtitle}</p>
        </div>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-divider">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${progressPct}%`, background: "linear-gradient(90deg,#6BCB77,#4FB35B)" }}
        />
      </div>

      <div className="flex flex-wrap gap-2.5">
        {ANIMAL_TIERS.map((tier) => {
          const opened = openedSet.has(tier.threshold);
          const ready = !opened && earnedTotal >= tier.threshold;
          const isOpening = openingThreshold === tier.threshold;
          const justPopped = justOpened === tier.threshold;
          return (
            <div key={tier.threshold} className="flex w-[46px] flex-none flex-col items-center gap-1">
              <button
                type="button"
                disabled={!ready || isOpening}
                onClick={() => openTier(tier.threshold)}
                aria-label={opened ? tier.name : ready ? `Mở ${tier.name}` : `Cần ${tier.threshold} sao`}
                className={`flex h-11 w-11 items-center justify-center rounded-2xl text-[20px] transition ${
                  ready ? "animate-[lockGlow_1.6s_ease-in-out_infinite]" : opened ? "" : "opacity-50 grayscale"
                } ${justPopped ? "animate-[popStar_0.5s_ease-out]" : ""}`}
                style={{
                  background: opened ? "var(--color-green-tint)" : ready ? "#fff8e1" : "var(--color-divider)",
                }}
              >
                {isOpening ? (
                  <Spinner size={15} className="text-muted" />
                ) : opened ? (
                  tier.emoji
                ) : ready ? (
                  <Unlock size={16} className="text-orange" />
                ) : (
                  <Lock size={15} className="text-muted" />
                )}
              </button>
              <span className="text-[10.5px] font-bold text-muted">{tier.threshold}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
