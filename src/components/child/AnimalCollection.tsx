import { Lock } from "lucide-react";
import { ANIMAL_TIERS, getCurrentTier, getNextTier } from "@/lib/animals";

export default function AnimalCollection({ earnedTotal }: { earnedTotal: number }) {
  const current = getCurrentTier(earnedTotal);
  const next = getNextTier(earnedTotal);
  const base = current?.threshold ?? 0;
  const target = next?.threshold ?? base;
  const progressPct = next ? Math.min(100, Math.round(((earnedTotal - base) / (target - base)) * 100)) : 100;

  return (
    <div className="flex flex-col gap-3.5 rounded-[22px] bg-white p-4 shadow-md">
      <div className="flex items-center gap-3">
        <span
          className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl text-[32px]"
          style={{ background: "var(--color-green-tint)" }}
        >
          {current ? current.emoji : "🥚"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[15px] font-bold">{current ? current.name : "Chưa mở con nào"}</p>
          <p className="text-[12.5px] font-semibold text-muted">
            {next
              ? `Còn ${next.threshold - earnedTotal} sao nữa để mở ${next.emoji} ${next.name}`
              : "Đã mở hết bộ sưu tập! 🎉"}
          </p>
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
          const unlocked = earnedTotal >= tier.threshold;
          const isNext = !unlocked && tier.threshold === next?.threshold;
          return (
            <div key={tier.threshold} className="flex w-[46px] flex-none flex-col items-center gap-1">
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-2xl text-[20px] ${
                  unlocked ? "" : "opacity-50 grayscale"
                }`}
                style={{
                  background: unlocked ? "var(--color-green-tint)" : "var(--color-divider)",
                  boxShadow: isNext ? "0 0 0 2px var(--color-green)" : undefined,
                }}
              >
                {unlocked ? tier.emoji : <Lock size={15} className="text-muted" />}
              </span>
              <span className="text-[10.5px] font-bold text-muted">{tier.threshold}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
