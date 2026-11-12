'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { LESSONS } from '@/lib/mathfun/curriculum';
import {
  ISLANDS, MAP_H, MAP_W, MAP_TITLE, currentIslandNumber, islandProgress,
  type BadgeLike, type Island,
} from '@/lib/mathfun/islands';

const BADGE_EMOJI: Record<string, string> = { bronze: '🥉', silver: '🥈', gold: '🥇', perfect: '👑' };

/** Small deterministic PRNG so server and client render the same forest. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

interface Tree { x: number; y: number; s: number; kind: 'pine' | 'round' | 'palm'; tone: number }

function buildForest(): Tree[] {
  const rnd = mulberry32(5);
  const out: Tree[] = [];
  const inWater = (x: number, y: number) =>
    ((x / 300) ** 2 + (y / 150) ** 2 < 1) || (((x - 1300) / 380) ** 2 + ((y - 740) / 150) ** 2 < 1);
  for (let k = 0; k < 900 && out.length < 95; k++) {
    const x = rnd() * MAP_W, y = 30 + rnd() * (MAP_H - 20), s = 0.6 + rnd() * 0.7;
    const kind = rnd() < 0.45 ? 'pine' : rnd() < 0.8 ? 'round' : 'palm';
    if (inWater(x, y) || (y < 105 && x > 220 && x < 1060)) continue;
    if (ISLANDS.some((i) => ((x - i.x) / 125) ** 2 + ((y - (i.y - 10)) / 95) ** 2 < 1)) continue;
    let nearPath = false;
    for (let i = 0; i < ISLANDS.length - 1; i++) {
      if (distToSegment(x, y, ISLANDS[i].x, ISLANDS[i].y, ISLANDS[i + 1].x, ISLANDS[i + 1].y) < 55) nearPath = true;
    }
    if (nearPath) continue;
    if (out.some((t) => Math.hypot(t.x - x, t.y - y) < 42 * Math.min(s, 1))) continue;
    out.push({ x, y, s, kind, tone: Math.floor(rnd() * 3) });
  }
  return out.sort((a, b) => a.y - b.y);
}

function pathThrough(points: { x: number; y: number }[]) {
  let d = `M ${points[0].x} ${points[0].y + 12}`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    const mx = (a.x + b.x) / 2;
    d += ` C ${mx} ${a.y + 12}, ${mx} ${b.y + 12}, ${b.x} ${b.y + 12}`;
  }
  return d;
}

const PINE_TONES = ['#1f7a4a', '#176b40', '#2a8f57'];
const ROUND_TONES = ['#52b848', '#66c453', '#3fa63e'];

function PineTree({ t }: { t: Tree }) {
  const c = PINE_TONES[t.tone];
  return (
    <g transform={`translate(${t.x} ${t.y}) scale(${t.s})`}>
      <ellipse cx="0" cy="2" rx="16" ry="5" fill="#000" opacity="0.15" />
      <rect x="-3" y="-8" width="6" height="10" fill="#6b4423" />
      <polygon points="0,-62 -17,-30 17,-30" fill={c} />
      <polygon points="0,-48 -21,-16 21,-16" fill={c} />
      <polygon points="0,-34 -25,-2 25,-2" fill={c} />
      <polygon points="0,-62 -17,-30 0,-30" fill="#fff" opacity="0.12" />
    </g>
  );
}

function RoundTree({ t }: { t: Tree }) {
  const c = ROUND_TONES[t.tone];
  return (
    <g transform={`translate(${t.x} ${t.y}) scale(${t.s})`}>
      <ellipse cx="0" cy="2" rx="16" ry="5" fill="#000" opacity="0.15" />
      <rect x="-3.5" y="-26" width="7" height="28" fill="#7a4e2a" />
      <circle cx="0" cy="-42" r="21" fill={c} />
      <circle cx="-8" cy="-48" r="9" fill="#fff" opacity="0.14" />
    </g>
  );
}

function Palm({ x, y, s = 1, lean = 1 }: { x: number; y: number; s?: number; lean?: number }) {
  const fronds = [-70, -35, 0, 35, 70, 160, 200];
  return (
    <g transform={`translate(${x} ${y}) scale(${s * lean} ${s})`}>
      <path d="M0 0 C 4 -24, 2 -44, 12 -66" stroke="#8b5a2b" strokeWidth="6" fill="none" strokeLinecap="round" />
      <g transform="translate(12 -66)">
        {fronds.map((a) => (
          <ellipse key={a} cx="0" cy="-17" rx="7" ry="26" fill="#43b968" stroke="#2c8f4c" strokeWidth="1.2"
            transform={`rotate(${a})`} />
        ))}
        <circle r="4" fill="#6b4423" />
      </g>
    </g>
  );
}

function Mountain({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <polygon points="-64,0 -8,-72 30,0" fill="#8c95a3" />
      <polygon points="-8,-72 30,0 8,0" fill="#6e7787" />
      <polygon points="-8,-72 -24,-46 -14,-50 -8,-42 0,-52 6,-46" fill="#fff" />
      <polygon points="18,0 50,-44 82,0" fill="#9aa3b1" />
      <polygon points="50,-44 82,0 62,0" fill="#7b8494" />
      <polygon points="50,-44 41,-31 48,-34 52,-28 58,-34" fill="#fff" />
    </g>
  );
}

function Chest({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-50" y="2" width="100" height="10" rx="2" fill="#b9b9b9" />
      <rect x="-38" y="-8" width="76" height="10" rx="2" fill="#c9c9c9" />
      <rect x="-24" y="-48" width="48" height="40" rx="3" fill="#8a4f1d" stroke="#5a3010" strokeWidth="2" />
      <path d="M-24 -34 a24 22 0 0 1 48 0 z" fill="#a8641f" stroke="#5a3010" strokeWidth="2" transform="translate(0 -14)" />
      <rect x="-24" y="-30" width="48" height="5" fill="#f5c542" />
      <rect x="-5" y="-34" width="10" height="13" rx="2" fill="#ffd95a" stroke="#a37a00" />
      <circle cx="0" cy="-28" r="2" fill="#a37a00" />
      <ellipse cx="0" cy="-48" rx="40" ry="26" fill="#ffd95a" opacity="0.18" className="mf-glow" />
    </g>
  );
}

function IslandNode({
  island, active, current, progress, onOpen,
}: {
  island: Island; active: boolean; current: boolean;
  progress: ReturnType<typeof islandProgress>; onOpen: () => void;
}) {
  const { x, y, n, title, icon, scenery } = island;
  const labelW = Math.max(90, title.length * 11.5 + 34);
  const iconR = icon.length > 2 ? 26 : 22;
  return (
    <g
      className="mf-island"
      role="button"
      tabIndex={0}
      aria-label={`Đảo ${n}: ${title}. Đã xong ${progress.done}/${progress.total} bài`}
      aria-pressed={active}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
    >
      <ellipse cx={x} cy={y + 52} rx="92" ry="20" fill="#000" opacity="0.22" />
      <path d={`M ${x - 78} ${y} A 78 34 0 0 0 ${x + 78} ${y} L ${x + 70} ${y + 30} A 70 30 0 0 1 ${x - 70} ${y + 30} Z`}
        fill="url(#mf-side)" />
      <ellipse cx={x} cy={y} rx="78" ry="34" fill="url(#mf-grass)" stroke="#2f8a3a" strokeWidth="2" />
      <ellipse cx={x - 4} cy={y + 2} rx="52" ry="20" fill="#78d36a" opacity="0.55" />
      {[[-48, 8], [-18, 14], [24, 10], [52, 2]].map(([dx, dy], k) => (
        <circle key={k} cx={x + dx} cy={y + dy} r="2.2" fill={['#ff7aa8', '#ffd95a', '#fff'][k % 3]} />
      ))}
      <ellipse cx={x + 55} cy={y + 14} rx="7" ry="4" fill="#a9afb8" />
      <ellipse cx={x - 58} cy={y + 12} rx="6" ry="3.5" fill="#a9afb8" />

      {scenery === 'palm' && (<><Palm x={x - 22} y={y + 6} s={1} /><Palm x={x + 30} y={y + 2} s={0.8} lean={-1} /></>)}
      {scenery === 'mountain' && <Mountain x={x} y={y + 4} />}
      {scenery === 'chest' && (<><Chest x={x - 6} y={y - 2} /><Palm x={x + 56} y={y + 4} s={0.8} lean={-1} /></>)}

      {/* number badge */}
      <g transform={`translate(${x - 68} ${y - 40})`}>
        <circle r="19" fill={progress.complete ? '#3cb04f' : 'url(#mf-gold)'} stroke={progress.complete ? '#1f7a2e' : '#b36b00'} strokeWidth="3" />
        <text textAnchor="middle" dominantBaseline="central" fontSize="22" fontWeight="900" fill="#fff"
          stroke="#7a4300" strokeWidth="0.8" paintOrder="stroke">{progress.complete ? '✓' : n}</text>
      </g>

      {/* guard monster */}
      <text x={x + 34} y={y - 14} textAnchor="middle" fontSize="30" className={current ? 'mf-bob' : ''}>{island.guard}</text>

      {/* symbol bubble */}
      <g transform={`translate(${x + 68} ${y - 44})`}>
        <circle r={iconR} fill="#fff" stroke="#e6efe6" strokeWidth="2" />
        <text textAnchor="middle" dominantBaseline="central" fontSize={icon.length > 2 ? 15 : 22} fontWeight="900" fill="#2e8f46">{icon}</text>
      </g>

      {/* stone label */}
      <g transform={`translate(${x} ${y + 68})`}>
        <rect x={-labelW / 2} y="-19" width={labelW} height="38" rx="9" fill="#d5dae0" stroke="#8d96a1" strokeWidth="2" />
        <rect x={-labelW / 2 + 3} y="-16" width={labelW - 6} height="14" rx="6" fill="#fff" opacity="0.35" />
        <text textAnchor="middle" dominantBaseline="central" fontSize="22" fontWeight="800" fill="#2f3945">{title}</text>
        {progress.total > 0 && (
          <g transform={`translate(${labelW / 2 - 4} 28)`}>
            <rect x="-30" y="-11" width="40" height="22" rx="11" fill={progress.complete ? '#3cb04f' : '#1a1a1a'} />
            <text x="-10" textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="900" fill="#fff">{progress.done}/{progress.total}</text>
          </g>
        )}
      </g>

      {current && (
        <g transform={`translate(${x} ${y - 96})`}><g className="mf-bounce">
          <path d="M0 18 L-11 2 H11 Z" fill="#e85555" stroke="#1a1a1a" strokeWidth="2.5" strokeLinejoin="round" />
          <rect x="-34" y="-20" width="68" height="24" rx="12" fill="#e85555" stroke="#1a1a1a" strokeWidth="2.5" />
          <text y="-8" textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="900" fill="#fff">ĐI TIẾP</text>
        </g></g>
      )}
      {active && <ellipse cx={x} cy={y + 8} rx="96" ry="52" fill="none" stroke="#ffd95a" strokeWidth="4" strokeDasharray="10 8" />}
    </g>
  );
}

export default function IslandMap({ badges }: { badges: BadgeLike[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const forest = useMemo(() => buildForest(), []);
  const trail = useMemo(() => pathThrough(ISLANDS), []);
  const flies = useMemo(() => {
    const r = mulberry32(11);
    return Array.from({ length: 34 }, () => ({ x: r() * MAP_W, y: 90 + r() * 600, d: r() * 5, s: 1.2 + r() * 1.6 }));
  }, []);
  const current = currentIslandNumber(badges);
  const selected = ISLANDS.find((i) => i.n === open) ?? null;

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="mf-map-wrap card-comic rounded-2xl overflow-hidden relative">
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="block w-full h-auto min-w-0"
        role="group"
        aria-label={MAP_TITLE}
      >
        <defs>
          <radialGradient id="mf-bg" cx="50%" cy="45%" r="75%">
            <stop offset="0%" stopColor="#2f9d4b" /><stop offset="100%" stopColor="#176b3a" />
          </radialGradient>
          <linearGradient id="mf-water" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2f86d4" /><stop offset="100%" stopColor="#58b3ee" />
          </linearGradient>
          <linearGradient id="mf-grass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8bdc6f" /><stop offset="100%" stopColor="#4fb55a" />
          </linearGradient>
          <linearGradient id="mf-side" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b57a45" /><stop offset="100%" stopColor="#7a4e2a" />
          </linearGradient>
          <radialGradient id="mf-gold" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#ffd45a" /><stop offset="100%" stopColor="#f08a00" />
          </radialGradient>
          <linearGradient id="mf-ribbon" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2e7d3a" /><stop offset="100%" stopColor="#1c5a28" />
          </linearGradient>
        </defs>

        <rect width={MAP_W} height={MAP_H} fill="url(#mf-bg)" />
        <ellipse cx="0" cy="0" rx="300" ry="150" fill="url(#mf-water)" />
        <ellipse cx="0" cy="0" rx="300" ry="150" fill="none" stroke="#bfe6ff" strokeWidth="3" opacity="0.5" />
        <ellipse cx="1300" cy="740" rx="380" ry="150" fill="url(#mf-water)" />
        <ellipse cx="1300" cy="740" rx="380" ry="150" fill="none" stroke="#bfe6ff" strokeWidth="3" opacity="0.5" />

        {/* forest */}
        {forest.map((t, i) => t.kind === 'pine' ? <PineTree key={i} t={t} />
          : t.kind === 'round' ? <RoundTree key={i} t={t} />
            : <Palm key={i} x={t.x} y={t.y} s={t.s * 0.9} lean={i % 2 ? 1 : -1} />)}

        {/* trail */}
        <path d={trail} stroke="#b89a64" strokeWidth="16" strokeLinecap="round" fill="none" opacity="0.55" />
        <path d={trail} stroke="#f6ecc8" strokeWidth="5" strokeLinecap="round" strokeDasharray="1 13" fill="none" />

        {/* fireflies */}
        {flies.map((f, i) => (
          <circle key={i} cx={f.x} cy={f.y} r={f.s} fill="#ffe98a" className="mf-fly" style={{ animationDelay: `${f.d}s` }} />
        ))}

        {ISLANDS.map((i) => (
          <IslandNode
            key={i.n}
            island={i}
            active={open === i.n}
            current={current === i.n}
            progress={islandProgress(i, badges)}
            onOpen={() => setOpen(open === i.n ? null : i.n)}
          />
        ))}

        {/* ship */}
        <g transform="translate(1190 650)"><g className="mf-bob">
          <ellipse cx="0" cy="38" rx="62" ry="10" fill="#fff" opacity="0.25" />
          <path d="M-50 18 H50 L36 40 H-36 Z" fill="#8a4f1d" stroke="#5a3010" strokeWidth="2.5" />
          <rect x="-3" y="-44" width="6" height="64" fill="#5a3010" />
          <path d="M5 -40 C40 -22, 40 4, 5 14 Z" fill="#fff7e0" stroke="#5a3010" strokeWidth="2" />
          <path d="M-5 -34 C-32 -18, -32 2, -5 12 Z" fill="#fff7e0" stroke="#5a3010" strokeWidth="2" />
          <path d="M-3 -44 L-3 -60 L16 -54 L-3 -48 Z" fill="#e85555" />
        </g></g>

        {/* compass */}
        <g transform="translate(80 105)">
          <circle r="42" fill="#fff6dc" stroke="#7a5a2b" strokeWidth="5" />
          <circle r="34" fill="none" stroke="#c9a96b" strokeWidth="1.5" />
          <polygon points="0,-30 7,0 -7,0" fill="#d93a3a" />
          <polygon points="0,30 7,0 -7,0" fill="#8d96a1" />
          <circle r="4" fill="#7a5a2b" />
          <text y="-52" textAnchor="middle" fontSize="15" fontWeight="900" fill="#fff" stroke="#14532d" strokeWidth="3" paintOrder="stroke">B</text>
        </g>

        {/* banner */}
        <g>
          <path d="M240 36 H310 V94 H240 L262 66 Z" fill="#1c5a28" />
          <path d="M1040 36 H970 V94 H1040 L1018 66 Z" fill="#1c5a28" />
          <rect x="290" y="18" width="700" height="64" rx="8" fill="url(#mf-ribbon)" stroke="#123d1b" strokeWidth="4" />
          <rect x="298" y="24" width="684" height="12" rx="6" fill="#fff" opacity="0.18" />
          <text x="640" y="52" textAnchor="middle" dominantBaseline="central" fontSize="33" fontWeight="900" fill="#fff"
            stroke="#0e3318" strokeWidth="3" paintOrder="stroke" letterSpacing="1">{MAP_TITLE}</text>
        </g>
      </svg>

      {selected && (
        <LessonSheet island={selected} badges={badges} onClose={() => setOpen(null)} />
      )}
    </div>
  );
}

function LessonSheet({ island, badges, onClose }: { island: Island; badges: BadgeLike[]; onClose: () => void }) {
  const lessons = island.lessonIds.map((id) => LESSONS.find((l) => l.id === id)).filter((l) => !!l);
  const prog = islandProgress(island, badges);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 p-3 sm:p-6"
      onClick={onClose} role="presentation">
      <div
        role="dialog" aria-modal="true" aria-label={`Đảo ${island.n}: ${island.title}`}
        className="card-comic bg-[#fffaf0] rounded-2xl w-full max-w-lg max-h-full overflow-y-auto p-4 sm:p-5 mf-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="w-11 h-11 rounded-full bg-[#FFD015] border-[3px] border-[#1a1a1a] flex items-center justify-center font-black text-xl shrink-0">
            {prog.complete ? '✓' : island.n}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-xl leading-tight">Đảo {island.n}: {island.title}</h3>
            <p className="text-sm font-semibold text-gray-500">
              {island.guard} {island.guardName} · {prog.done}/{prog.total} bài{prog.complete ? ' · Đã hạ xong! 🎉' : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng"
            className="card-comic-sm bg-white rounded-lg w-9 h-9 font-black shrink-0 hover:bg-gray-100">✕</button>
        </div>
        <div className="flex flex-col gap-2">
          {lessons.map((l) => {
            const b = badges.find((x) => x.topic === l!.id);
            const pct = b?.bestScore ?? 0;
            return (
              <Link key={l!.id} href={`/mathfun/practice?topic=${l!.id}`}
                className="card-comic-sm bg-white rounded-xl p-3 flex items-center gap-3 hover:-translate-y-0.5 transition-all">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border-2 border-[#1a1a1a] shrink-0 ${l!.color}`}>{l!.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-sm text-[#1a1a1a]">{l!.label}</div>
                  <div className="h-2 mt-1 bg-gray-100 rounded-full border border-gray-200 overflow-hidden">
                    <div className={`h-full rounded-full ${pct >= 90 ? 'bg-green-500' : pct >= 70 ? 'bg-yellow-400' : 'bg-blue-400'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="text-right shrink-0 font-black text-xs">
                  {b ? <><span className="text-base">{BADGE_EMOJI[b.badge]}</span><div className="text-green-600">{pct}%</div></> : <span className="text-gray-400">CHƠI ▶</span>}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
