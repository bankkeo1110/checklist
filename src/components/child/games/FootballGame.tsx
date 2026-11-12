'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { sfx } from '@/lib/sfx';
import { getCredit, setCredit } from '@/lib/mathfun/footballCredit';
import { CHARS, DEFAULT_DIFFICULTY, DIFFICULTIES, LEVELS, MATCH_SECONDS, VH, VW, emptyInput, newGame, step, type Char, type Input } from '@/lib/football/sim';
import { MY_SHIRT, draw, drawChar, newView, onEvents } from './footballDraw';

type Stage = 'menu' | 'play' | 'result' | 'over';
interface Cup { stage: number; trophies: number }
interface Result { mine: number; theirs: number; level: number; champion: boolean }

/** Where each pick lines up: the first one leads the attack. */
const POSITIONS = ['Tiền đạo', 'Tiền vệ', 'Tiền vệ', 'Hậu vệ'];

const CUP_KEY = 'football_cup_v1';
const DIFF_KEY = 'football_difficulty_v1';
const SCALE = 2; // canvas backing store is 2× the logical view so sprites stay crisp

function loadCup(): Cup {
  try {
    const c = JSON.parse(localStorage.getItem(CUP_KEY) ?? '{}');
    return { stage: Math.min(LEVELS.length - 1, Math.max(0, Number(c.stage) || 0)), trophies: Math.max(0, Number(c.trophies) || 0) };
  } catch { return { stage: 0, trophies: 0 }; }
}
function saveCup(c: Cup) { try { localStorage.setItem(CUP_KEY, JSON.stringify(c)); } catch { /* storage blocked */ } }

function loadDiff(): number {
  try {
    const n = Number(localStorage.getItem(DIFF_KEY));
    return Number.isInteger(n) && n >= 0 && n < DIFFICULTIES.length ? n : DEFAULT_DIFFICULTY;
  } catch { return DEFAULT_DIFFICULTY; }
}

function CharThumb({ c }: { c: Char }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.clearRect(0, 0, 64, 70);
    drawChar(ctx, c, 32, 50, { fx: 0, fy: 1, shirt: MY_SHIRT, tick: 0 }, 1.5);
  }, [c]);
  return <canvas ref={ref} width={128} height={140} className="h-[70px] w-16" />;
}

function Stat({ label, n }: { label: string; n: number }) {
  return (
    <span className="flex items-center gap-0.5 text-[9px] font-black text-gray-500">
      {label}
      {[1, 2, 3, 4, 5].map((i) => <i key={i} className={`h-1.5 w-1.5 rounded-full ${i <= n ? 'bg-green-500' : 'bg-gray-200'}`} />)}
    </span>
  );
}

/** preview = parent view: no time limit, nothing is spent, every opponent unlocked. */
export default function FootballGame({ preview = false }: { preview?: boolean }) {
  const [stage, setStage] = useState<Stage>('menu');
  const [picked, setPicked] = useState<number[]>([0, 1, 2, 3]);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(preview ? Infinity : null);
  const [cup, setCup] = useState<Cup>({ stage: 0, trophies: 0 });
  const [level, setLevel] = useState(0);
  const [diff, setDiff] = useState(DEFAULT_DIFFICULTY);
  const [result, setResult] = useState<Result | null>(null);
  const [paused, setPaused] = useState(false);
  const [touch, setTouch] = useState(false);
  const [matchNo, setMatchNo] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useRef({ left: false, right: false, up: false, down: false, shoot: false, pass: false, tackle: false, sprint: false, ax: 0, ay: 0 });
  const pausedRef = useRef(false);
  const [stick, setStick] = useState({ x: 0, y: 0 });

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- localStorage / matchMedia are only readable after mount */
    const c = loadCup();
    setCup(c); setLevel(c.stage);
    setDiff(loadDiff());
    setTouch(window.matchMedia('(pointer: coarse)').matches);
    if (!preview) setSecondsLeft(getCredit());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [preview]);

  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // Spend earned play time only while a match is running; persisted every second so a refresh can't reset it.
  useEffect(() => {
    if (stage !== 'play' || preview || paused) return;
    let left = getCredit();
    const id = setInterval(() => {
      left -= 1;
      setCredit(left);
      setSecondsLeft(left);
      if (left <= 0) { clearInterval(id); setStage('over'); }
    }, 1000);
    return () => clearInterval(id);
  }, [stage, preview, paused]);

  // match loop: fixed 60 Hz simulation, drawn every animation frame
  useEffect(() => {
    if (stage !== 'play') return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const others = CHARS.map((_, i) => i).filter((i) => !picked.includes(i)).sort(() => Math.random() - 0.5);
    const g = newGame(picked, others, level, diff);
    const view = newView();
    const k = keys.current;
    Object.assign(k, { left: false, right: false, up: false, down: false, shoot: false, pass: false, tackle: false, sprint: false, ax: 0, ay: 0 });
    const input = (): Input => {
      const i = emptyInput();
      i.dx = k.ax || +k.right - +k.left; i.dy = k.ay || +k.down - +k.up;
      i.shoot = k.shoot; i.pass = k.pass; i.tackle = k.tackle; i.sprint = k.sprint;
      return i;
    };
    const FX: Record<string, () => void> = {
      kick: sfx.kick, bigkick: sfx.kick, super: sfx.power, save: sfx.save, tackle: sfx.thud, post: sfx.post,
      whistle: sfx.whistle, fulltime: sfx.fulltime, goal: () => { sfx.goal(); sfx.cheer(); },
    };
    let last = performance.now(), acc = 0, raf = 0, after = 0, done = false;
    const loop = (now: number) => {
      acc += Math.min(100, now - last); last = now;
      if (pausedRef.current) acc = 0;
      while (acc >= 1000 / 60) {
        step(g, input()); acc -= 1000 / 60;
        for (const e of g.ev) FX[e.t]?.();
        onEvents(view, g.ev);
        if (g.phase === 'full' && !done && ++after > 150) {
          done = true;
          const won = g.score[0] > g.score[1];
          let champion = false;
          if (won && !preview) {
            const c = loadCup();
            if (level >= c.stage) {
              champion = level === LEVELS.length - 1;
              const next = champion ? { stage: 0, trophies: c.trophies + 1 } : { stage: level + 1, trophies: c.trophies };
              saveCup(next); setCup(next);
            }
          }
          setResult({ mine: g.score[0], theirs: g.score[1], level, champion });
          setStage('result');
        }
      }
      draw(ctx, g, view, SCALE);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [stage, picked, level, diff, preview, matchNo]);

  // keyboard
  useEffect(() => {
    type Key = 'left' | 'right' | 'up' | 'down' | 'shoot' | 'pass' | 'tackle' | 'sprint';
    const map: Record<string, Key> = {
      ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
      Space: 'shoot', KeyJ: 'shoot', KeyX: 'pass', KeyK: 'pass', KeyZ: 'tackle', KeyL: 'tackle', ShiftLeft: 'sprint', ShiftRight: 'sprint', KeyC: 'sprint',
    };
    const on = (v: boolean) => (e: KeyboardEvent) => {
      if (stage !== 'play') return;
      if (v && (e.code === 'KeyP' || e.code === 'Escape')) { setPaused((p) => !p); return; }
      const key = map[e.code];
      if (!key) return;
      e.preventDefault(); keys.current[key] = v;
    };
    const down = on(true), up = on(false);
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [stage]);

  const hold = (key: 'shoot' | 'pass' | 'tackle' | 'sprint') => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); keys.current[key] = true; },
    onPointerUp: () => { keys.current[key] = false; },
    onPointerLeave: () => { keys.current[key] = false; },
    onPointerCancel: () => { keys.current[key] = false; },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  const moveStick = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect(), R = r.width / 2;
    let x = (e.clientX - r.left - R) / (R * 0.7), y = (e.clientY - r.top - R) / (R * 0.7);
    const l = Math.hypot(x, y);
    if (l > 1) { x /= l; y /= l; }
    keys.current.ax = l < 0.2 ? 0 : x; keys.current.ay = l < 0.2 ? 0 : y;
    setStick({ x, y });
  };
  const endStick = () => { keys.current.ax = keys.current.ay = 0; setStick({ x: 0, y: 0 }); };

  const pickDiff = (i: number) => {
    setDiff(i);
    try { localStorage.setItem(DIFF_KEY, String(i)); } catch { /* storage blocked */ }
  };

  const startMatch = (lv: number) => { setLevel(lv); setResult(null); setPaused(false); setMatchNo((n) => n + 1); setStage('play'); };

  if (secondsLeft === null) return <p className="text-center font-semibold text-gray-500">Đang tải…</p>;

  if (secondsLeft <= 0 || stage === 'over') {
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-white p-10 text-center shadow-xl">
        <h2 className="mb-2 text-2xl font-bold text-green-700">⏱️ Hết giờ chơi rồi!</h2>
        <p className="mb-6 font-semibold text-gray-600">Làm xong một bài toán đạt 100 điểm để được chơi thêm 5 phút nhé. Giải đấu vẫn được lưu lại!</p>
        <Link href="/mathfun" className="rounded-full bg-green-500 px-8 py-3 text-lg font-bold text-white shadow-lg">
          🗺️ Đi làm toán
        </Link>
      </div>
    );
  }

  const unlocked = preview ? LEVELS.length - 1 : cup.stage;
  const clock = Number.isFinite(secondsLeft) ? `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}` : '∞';

  if (stage === 'result' && result) {
    const won = result.mine > result.theirs, draw_ = result.mine === result.theirs, lv = LEVELS[result.level];
    const nextLv = won && !result.champion ? Math.min(result.level + 1, LEVELS.length - 1) : result.level;
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="text-6xl">{result.champion ? '🏆' : won ? '🎉' : draw_ ? '🤝' : '😤'}</div>
        <h2 className="text-2xl font-black">
          {result.champion ? 'VÔ ĐỊCH GIẢI ĐẤU!' : won ? 'CHIẾN THẮNG!' : draw_ ? 'Hòa rồi!' : 'Thua mất rồi…'}
        </h2>
        <p className="text-4xl font-black tabular-nums">
          <span style={{ color: MY_SHIRT }}>{result.mine}</span> – <span style={{ color: lv.color }}>{result.theirs}</span>
        </p>
        <p className="font-semibold text-gray-600">
          {result.champion ? 'Bạn đã hạ cả 5 đội! Nhận 1 cúp vàng, giải đấu bắt đầu lại từ đầu.'
            : won ? `Đã hạ ${lv.emoji} ${lv.name}. Đối thủ tiếp theo: ${LEVELS[nextLv].emoji} ${LEVELS[nextLv].name}!`
              : `Đấu lại với ${lv.emoji} ${lv.name} nhé — nhắm vào góc khung thành và chuyền nhiều hơn!`}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button onClick={() => startMatch(result.champion ? 0 : nextLv)} className="rounded-full bg-green-500 px-6 py-3 font-bold text-white shadow-lg">
            ▶ {won ? 'Trận tiếp theo' : 'Đá lại'}
          </button>
          <button onClick={() => setStage('menu')} className="rounded-full bg-gray-100 px-6 py-3 font-bold text-gray-700">Đổi đội hình</button>
        </div>
        <p className="text-sm font-bold text-gray-400">
          Mức {DIFFICULTIES[diff].emoji} {DIFFICULTIES[diff].name}
          {!preview && <> · ⏱️ Giờ chơi còn {clock}</>}
        </p>
        {won && diff < DIFFICULTIES.length - 1 && (
          <button onClick={() => { pickDiff(diff + 1); setStage('menu'); }} className="text-sm font-black text-blue-600 underline">
            Thấy dễ quá? Thử mức {DIFFICULTIES[diff + 1].emoji} {DIFFICULTIES[diff + 1].name} →
          </button>
        )}
        {!won && diff > 0 && (
          <button onClick={() => { pickDiff(diff - 1); setStage('menu'); }} className="text-sm font-black text-blue-600 underline">
            Khó quá? Chuyển về mức {DIFFICULTIES[diff - 1].emoji} {DIFFICULTIES[diff - 1].name} →
          </button>
        )}
      </div>
    );
  }

  if (stage === 'menu') {
    const toggle = (i: number) => setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : p.length < 4 ? [...p, i] : p));
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <div className="text-center">
          <h2 className="text-2xl font-black">⚽ Giải đấu chiến binh</h2>
          <p className="text-sm font-semibold text-gray-600">
            Hạ 5 đội để vô địch! {cup.trophies > 0 && <b>Cúp vàng: {'🏆'.repeat(Math.min(cup.trophies, 5))}{cup.trophies > 5 ? ` ×${cup.trophies}` : ''}</b>}
            {!preview && <> · ⏱️ Giờ chơi còn <b>{clock}</b></>}
          </p>
        </div>

        <div>
          <p className="mb-1 text-center text-sm font-black">Mức chơi</p>
          <div className="grid grid-cols-3 gap-2">
            {DIFFICULTIES.map((d, i) => (
              <button key={d.id} onClick={() => pickDiff(i)} aria-pressed={i === diff}
                className={`flex flex-col items-center rounded-2xl border-4 bg-white p-2 ${i === diff ? 'border-yellow-400 shadow-lg' : 'border-transparent opacity-70'}`}>
                <span className="text-2xl">{d.emoji}</span>
                <span className="text-sm font-black">{d.name}{i === DEFAULT_DIFFICULTY ? ' ⭐' : ''}</span>
              </button>
            ))}
          </div>
          <p className="mt-1 text-center text-xs font-semibold text-gray-500">{DIFFICULTIES[diff].blurb}</p>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {LEVELS.map((lv, i) => {
            const locked = i > unlocked, sel = i === level;
            return (
              <button key={lv.name} disabled={locked} onClick={() => setLevel(i)} aria-pressed={sel}
                className={`flex flex-col items-center rounded-2xl border-4 bg-white p-2 text-center ${sel ? 'border-yellow-400 shadow-lg' : 'border-transparent'} ${locked ? 'opacity-45' : ''}`}>
                <span className="text-2xl">{locked ? '🔒' : i < unlocked ? '✅' : lv.emoji}</span>
                <span className="text-[11px] font-black leading-tight">{lv.name}</span>
                <span className="text-[10px] font-bold text-gray-400">{'★'.repeat(i + 1)}</span>
              </button>
            );
          })}
        </div>

        <div>
          <p className="mb-1 text-center text-sm font-black">Chọn 4 chiến binh ({picked.length}/4)</p>
          <p className="mb-1 text-center text-xs font-semibold text-gray-500">Người chọn đầu tiên đá tiền đạo — bạn điều khiển bạn ấy khi giao bóng. Thủ môn tự vào sân.</p>
          <div className="grid grid-cols-4 gap-2">
            {CHARS.map((c, i) => (
              <button key={c.id} onClick={() => toggle(i)} aria-pressed={picked.includes(i)}
                className={`relative flex flex-col items-center rounded-2xl border-4 bg-white p-1.5 ${picked.includes(i) ? 'border-yellow-400 shadow-lg' : 'border-transparent opacity-70'}`}>
                {picked.includes(i) && (
                  <span className="absolute left-1 top-1 rounded-full bg-[#1a1a1a] px-1.5 text-[10px] font-black text-white">
                    {POSITIONS[picked.indexOf(i)]}
                  </span>
                )}
                <CharThumb c={c} />
                <span className="text-xs font-black">{c.name}</span>
                <span className="text-[10px] font-bold" style={{ color: c.aura, filter: 'brightness(.7)' }}>{c.shot}</span>
                <Stat label="Tốc" n={c.spd} /><Stat label="Sút" n={c.pow} /><Stat label="Xoạc" n={c.tac} />
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white p-3 text-[12.5px] font-semibold leading-relaxed text-gray-600 shadow">
          <p>🕹️ <b>Mũi tên / WASD</b> chạy · <b>Shift</b> tăng tốc · <b>Space</b> sút — giữ càng lâu sút càng mạnh, bấm thêm ↑/↓ để nhắm <b>góc khung thành</b>.</p>
          <p><b>X</b> chuyền (không có bóng: đổi cầu thủ) · <b>Z</b> xoạc bóng · <b>P</b> tạm dừng.</p>
          <p>⚡ Chuyền và cướp bóng để nạp <b>KI</b>. KI đầy → giữ SÚT thật lâu rồi thả = <b>tuyệt chiêu</b> của chiến binh!</p>
        </div>

        <button disabled={picked.length !== 4} onClick={() => startMatch(level)}
          className="rounded-full bg-green-500 py-3 text-lg font-bold text-white shadow-lg disabled:opacity-40">
          ▶ Vào trận gặp {LEVELS[level].emoji} {LEVELS[level].name} · mức {DIFFICULTIES[diff].name} ({MATCH_SECONDS / 60} phút){preview ? ' — phụ huynh chơi thử' : ''}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
      <div className="flex items-center justify-between rounded-xl bg-white px-4 py-1.5 text-sm font-black shadow">
        <span>⏱️ Giờ chơi: {clock}{preview && ' (chơi thử)'}</span>
        <span className="hidden text-gray-400 sm:inline">Space sút · X chuyền · Z xoạc · Shift chạy</span>
        <button onClick={() => setPaused((p) => !p)} className="rounded-lg bg-gray-100 px-3 py-1">{paused ? '▶ Tiếp tục' : '⏸ Dừng'}</button>
      </div>
      <div className="relative">
        <canvas ref={canvasRef} width={VW * SCALE} height={VH * SCALE} className="block w-full touch-none select-none rounded-xl border-4 border-white shadow-xl" />
        {paused && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-black/60 text-white">
            <p className="text-3xl font-black">⏸ TẠM DỪNG</p>
            <button onClick={() => setPaused(false)} className="rounded-full bg-green-500 px-6 py-2 font-bold shadow-lg">▶ Chơi tiếp</button>
            <button onClick={() => { setPaused(false); setStage('menu'); }} className="rounded-full bg-white/20 px-6 py-2 font-bold">Thoát trận</button>
          </div>
        )}
      </div>
      {touch && (
        <div className="flex select-none items-center justify-between gap-3">
          <div className="relative h-32 w-32 touch-none rounded-full bg-white/70 shadow-inner"
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); moveStick(e); }}
            onPointerMove={(e) => { if (e.buttons || e.pointerType === 'touch') moveStick(e); }}
            onPointerUp={endStick} onPointerCancel={endStick}>
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-14 w-14 rounded-full bg-blue-500 shadow-lg"
              style={{ transform: `translate(calc(-50% + ${stick.x * 34}px), calc(-50% + ${stick.y * 34}px))` }} />
          </div>
          <div className="grid grid-cols-2 gap-2 [&>button]:touch-none [&>button]:rounded-2xl [&>button]:px-3 [&>button]:py-4 [&>button]:text-sm [&>button]:font-black [&>button]:text-white [&>button]:shadow-lg">
            <button className="bg-emerald-500" {...hold('sprint')}>🏃 Chạy</button>
            <button className="bg-sky-500" {...hold('pass')}>🎯 Chuyền</button>
            <button className="bg-orange-500" {...hold('tackle')}>💥 Xoạc</button>
            <button className="bg-red-500" {...hold('shoot')}>⚽ SÚT</button>
          </div>
        </div>
      )}
    </div>
  );
}
