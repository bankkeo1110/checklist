'use client';

import { TARGET_POINTS } from '@/lib/mathfun/practice-logic';

export interface BattleProps {
  guard: string;
  guardName: string;
  /** Damage dealt so far = points (0…100). */
  points: number;
  /** Bumps every time the kid lands a hit / takes one, so the animation replays. */
  hitKey: number;
  hurtKey: number;
  streak: number;
}

/** The exercise as a duel: every right answer takes a bite out of the guard's HP bar. */
export default function Battle({ guard, guardName, points, hitKey, hurtKey, streak }: BattleProps) {
  const hpPct = Math.max(0, 100 - (points / TARGET_POINTS) * 100);
  const hurt = hpPct <= 35;
  return (
    <div className="card-comic bg-white rounded-2xl p-3 mb-4">
      <div className="flex items-end gap-3">
        <div className={`text-4xl shrink-0 ${hurtKey ? 'mf-hero' : ''}`} key={`h${hurtKey}`} aria-hidden>🧒</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <span className="font-black text-sm truncate">{guardName}</span>
            <span className="font-black text-xs text-gray-400 tabular-nums shrink-0">
              {Math.max(0, TARGET_POINTS - points)}/{TARGET_POINTS} HP
            </span>
          </div>
          <div className="h-5 bg-gray-100 rounded-full border-2 border-[#1a1a1a] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${hurt ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${hpPct}%` }}
            />
          </div>
          {streak >= 2 && (
            <div key={`s${streak}`} className="mf-combo mt-1 font-black text-sm text-orange-500">
              🔥 CHUỖI {streak} — đòn mạnh hơn!
            </div>
          )}
        </div>

        <div className={`text-5xl shrink-0 ${hurt ? 'opacity-70' : ''}`} key={`g${hitKey}`} aria-label={guardName}>
          <span className={hitKey ? 'mf-shake inline-block' : 'inline-block'}>{guard}</span>
        </div>
      </div>
    </div>
  );
}
