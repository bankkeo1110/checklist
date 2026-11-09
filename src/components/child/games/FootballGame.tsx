'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { sfx } from '@/lib/sfx';
import { getCredit, setCredit } from '@/lib/mathfun/footballCredit';
import { CHARS, GY1, GY2, H, W, emptyInput, newGame, step, type Char, type Game, type Input } from '@/lib/football/sim';

type Stage = 'pick' | 'play' | 'over';

const TEAM = ['#2563eb', '#dc2626']; // player blue, CPU red

// ── drawing ──────────────────────────────────────────────────────────────────

function drawChar(ctx: CanvasRenderingContext2D, c: Char, x: number, y: number, o: { fx: number; fy: number; side: 0 | 1; down: boolean; moving: boolean; tick: number; glow?: boolean }) {
  const bob = o.moving && !o.down ? Math.sin(o.tick * 0.5) * 1.2 : 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,.25)';
  ctx.beginPath(); ctx.ellipse(0, 11, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
  if (o.glow) { ctx.fillStyle = c.shotColor + '66'; ctx.beginPath(); ctx.arc(0, -4, 17 + Math.sin(o.tick * 0.6) * 2, 0, Math.PI * 2); ctx.fill(); }
  if (o.down) { ctx.rotate(Math.PI / 2); ctx.translate(-2, 4); }
  ctx.translate(0, bob);
  // legs + shorts in team colour
  ctx.fillStyle = c.skin; ctx.fillRect(-4, 5, 3, 6); ctx.fillRect(1, 5, 3, 6);
  ctx.fillStyle = TEAM[o.side]; ctx.fillRect(-5, 1, 10, 5);
  // torso with belt
  ctx.fillStyle = c.outfit; ctx.fillRect(-6, -9, 12, 11);
  ctx.fillStyle = c.trim; ctx.fillRect(-6, -2, 12, 2);
  ctx.fillStyle = c.outfit; ctx.fillRect(-9, -8, 3, 8); ctx.fillRect(6, -8, 3, 8);
  ctx.fillStyle = c.skin; ctx.fillRect(-9, -1, 3, 3); ctx.fillRect(6, -1, 3, 3);
  // head
  ctx.fillStyle = c.skin; ctx.beginPath(); ctx.arc(0, -14, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = c.hair;
  const poly = (pts: number[][]) => { ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath(); ctx.fill(); };
  if (c.style === 'spike') poly([[-6, -15], [-8, -23], [-3, -19], [-1, -27], [2, -19], [6, -25], [6, -15]]);
  else if (c.style === 'flame') poly([[-6, -15], [-5, -23], [-2, -22], [0, -31], [2, -22], [5, -23], [6, -15]]);
  else if (c.style === 'turban') { ctx.fillRect(-6, -22, 12, 6); ctx.fillRect(-9, -10, 18, 3); }
  else if (c.style === 'dome') { ctx.beginPath(); ctx.arc(0, -14, 6.3, Math.PI, Math.PI * 2); ctx.fill(); poly([[-5, -19], [-7, -25], [-2, -20]]); poly([[5, -19], [7, -25], [2, -20]]); }
  else if (c.style === 'antenna') { ctx.fillRect(2, -20, 2, 8); ctx.beginPath(); ctx.arc(9, -26, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(3, -22, 6, 2); }
  else { ctx.fillStyle = '#7a5a2a'; ctx.fillRect(-2, -18, 1, 1); ctx.fillRect(1, -18, 1, 1); }
  // eyes look where the player is heading
  ctx.fillStyle = '#111';
  ctx.fillRect(-3 + o.fx * 2, -14 + o.fy * 1.5, 2, 2); ctx.fillRect(1 + o.fx * 2, -14 + o.fy * 1.5, 2, 2);
  ctx.restore();
}

function drawPitch(ctx: CanvasRenderingContext2D) {
  for (let i = 0; i < 10; i++) { ctx.fillStyle = i % 2 ? '#3f9d49' : '#4aae54'; ctx.fillRect((W / 10) * i, 0, W / 10, H); }
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2;
  ctx.strokeRect(6, 6, W - 12, H - 12);
  ctx.beginPath(); ctx.moveTo(W / 2, 6); ctx.lineTo(W / 2, H - 6); ctx.stroke();
  ctx.beginPath(); ctx.arc(W / 2, H / 2, 38, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeRect(6, 90, 70, 180); ctx.strokeRect(W - 76, 90, 70, 180);
  for (const gx of [0, W - 8]) { // goals with net
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(gx, GY1, 8, GY2 - GY1);
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1;
    for (let y = GY1; y <= GY2; y += 10) { ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx + 8, y); ctx.stroke(); }
  }
}

function draw(ctx: CanvasRenderingContext2D, g: Game, tick: number, trail: { x: number; y: number }[]) {
  drawPitch(ctx);
  const b = g.ball;
  // players sorted by y so lower ones overlap upper ones
  const ps = [...g.ps].sort((a, c) => a.y - c.y);
  for (const p of ps) {
    drawChar(ctx, CHARS[p.ch], p.x, p.y, { fx: p.fx, fy: p.fy, side: p.side, down: p.down > 0, moving: p.vx !== 0 || p.vy !== 0, tick, glow: p.charge >= 60 });
    if (p === g.ctl) { ctx.fillStyle = '#ffe14d'; ctx.beginPath(); ctx.moveTo(p.x - 4, p.y - 38); ctx.lineTo(p.x + 4, p.y - 38); ctx.lineTo(p.x, p.y - 32); ctx.fill(); }
    if (p.charge > 0) { ctx.fillStyle = '#0006'; ctx.fillRect(p.x - 9, p.y - 42, 18, 3); ctx.fillStyle = p.charge >= 60 ? CHARS[p.ch].shotColor : '#fff'; ctx.fillRect(p.x - 9, p.y - 42, 18 * Math.min(1, p.charge / 60), 3); }
    if (p.down > 0) { ctx.fillStyle = '#ffe14d'; ctx.font = '12px sans-serif'; ctx.fillText('✦', p.x - 5 + Math.sin(tick * 0.4) * 4, p.y - 18); }
  }
  // special-shot trail + ball
  if (b.sup) { trail.push({ x: b.x, y: b.y }); if (trail.length > 9) trail.shift(); } else trail.length = 0;
  const col = CHARS[g.ps.find((p) => p.side === b.ks)!.ch].shotColor;
  trail.forEach((t, i) => { ctx.fillStyle = col + Math.round((i / trail.length) * 150 + 20).toString(16).padStart(2, '0'); ctx.beginPath(); ctx.arc(t.x, t.y, 4 + i, 0, Math.PI * 2); ctx.fill(); });
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(b.x, b.y + 4, 4, 2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(b.x, b.y, 1.5, 0, Math.PI * 2); ctx.fill();
  // announcements
  g.msgs.forEach((m, i) => {
    ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = '#000';
    const y = 110 + i * 34; ctx.strokeText(m.text, W / 2, y); ctx.fillStyle = m.color; ctx.fillText(m.text, W / 2, y);
  });
  ctx.textAlign = 'left';
}

function CharThumb({ c, side }: { c: Char; side: 0 | 1 }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 60, 64);
    ctx.translate(30, 44); ctx.scale(1.5, 1.5);
    drawChar(ctx, c, 0, 0, { fx: 0, fy: 1, side, down: false, moving: false, tick: 0 });
  }, [c, side]);
  return <canvas ref={ref} width={60} height={64} />;
}

// ── component ────────────────────────────────────────────────────────────────

/** preview = parent view: no time limit, nothing is spent. */
export default function FootballGame({ preview = false }: { preview?: boolean }) {
  const [stage, setStage] = useState<Stage>('pick');
  const [picked, setPicked] = useState<number[]>([0, 1, 2]);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(preview ? Infinity : null);
  const [score, setScore] = useState<[number, number]>([0, 0]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useRef({ left: false, right: false, up: false, down: false, shoot: false, pass: false, tackle: false });

  useEffect(() => {
    if (preview) return;
    setSecondsLeft(getCredit()); // eslint-disable-line react-hooks/set-state-in-effect -- localStorage is only readable after mount
  }, [preview]);

  // Spend earned play time only while a match is running; persisted every second so a refresh can't reset it.
  useEffect(() => {
    if (stage !== 'play' || preview) return;
    let left = getCredit();
    const id = setInterval(() => {
      left -= 1;
      setCredit(left);
      setSecondsLeft(left);
      if (left <= 0) { clearInterval(id); setStage('over'); }
    }, 1000);
    return () => clearInterval(id);
  }, [stage, preview]);

  // match loop: fixed 60 Hz simulation, drawn every animation frame
  useEffect(() => {
    if (stage !== 'play') return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const others = CHARS.map((_, i) => i).filter((i) => !picked.includes(i)).sort(() => Math.random() - 0.5).slice(0, 3);
    const g = newGame(picked, others);
    const trail: { x: number; y: number }[] = [];
    const k = keys.current;
    const input = (): Input => { const i = emptyInput(); i.dx = +k.right - +k.left; i.dy = +k.down - +k.up; i.shoot = k.shoot; i.pass = k.pass; i.tackle = k.tackle; return i; };
    const FX: Record<string, () => void> = { kick: sfx.kick, super: sfx.goal, goal: sfx.goal, save: sfx.save, tackle: sfx.save, whistle: sfx.whistle };
    let last = performance.now(), acc = 0, tick = 0, raf = 0;
    const loop = (now: number) => {
      acc += Math.min(100, now - last); last = now;
      while (acc >= 1000 / 60) {
        step(g, input()); tick++; acc -= 1000 / 60;
        for (const e of g.ev) { FX[e]?.(); if (e === 'goal') setScore([...g.score] as [number, number]); }
      }
      draw(ctx, g, tick, trail);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [stage, picked]);

  // keyboard
  useEffect(() => {
    const map: Record<string, keyof typeof keys.current> = {
      ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
      Space: 'shoot', KeyJ: 'shoot', KeyX: 'pass', KeyK: 'pass', KeyZ: 'tackle', KeyL: 'tackle',
    };
    const on = (v: boolean) => (e: KeyboardEvent) => {
      const key = map[e.code];
      if (!key || stage !== 'play') return;
      e.preventDefault(); keys.current[key] = v;
    };
    const down = on(true), up = on(false);
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [stage]);

  const hold = (key: keyof typeof keys.current) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); keys.current[key] = true; },
    onPointerUp: () => { keys.current[key] = false; },
    onPointerLeave: () => { keys.current[key] = false; },
    onPointerCancel: () => { keys.current[key] = false; },
  });

  if (secondsLeft === null) return <p className="text-center font-semibold text-gray-500">Đang tải…</p>;

  if (secondsLeft <= 0 || stage === 'over') {
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-white p-10 text-center shadow-xl">
        <h2 className="mb-2 text-2xl font-bold text-green-700">⏱️ Hết giờ chơi rồi!</h2>
        {stage === 'over' && <p className="mb-2 text-xl font-black">Tỉ số cuối: {score[0]} – {score[1]}</p>}
        <p className="mb-6 font-semibold text-gray-600">Làm xong một bài toán đạt 100 điểm để được chơi thêm 5 phút nhé.</p>
        <Link href="/mathfun/practice" className="rounded-full bg-green-500 px-8 py-3 text-lg font-bold text-white shadow-lg">
          ➕ Đi làm toán
        </Link>
      </div>
    );
  }

  if (stage === 'pick') {
    const toggle = (i: number) => setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : p.length < 3 ? [...p, i] : p));
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4">
        <div className="text-center">
          <h2 className="text-xl font-black">⚽ Đá banh chiến binh</h2>
          <p className="text-sm font-semibold text-gray-600">Chọn 3 chiến binh cho đội của bạn ({picked.length}/3)</p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {CHARS.map((c, i) => (
            <button key={c.id} onClick={() => toggle(i)}
              className={`flex flex-col items-center rounded-2xl border-4 bg-white p-1 ${picked.includes(i) ? 'border-yellow-400 shadow-lg' : 'border-transparent opacity-70'}`}>
              <CharThumb c={c} side={0} />
              <span className="text-[11px] font-black">{c.name}</span>
            </button>
          ))}
        </div>
        <div className="rounded-xl bg-white p-3 text-[12.5px] font-semibold text-gray-600 shadow">
          <p>🕹️ Di chuyển: mũi tên / WASD · <b>Space</b> sút (giữ lâu rồi thả = <b>tuyệt chiêu</b>) · <b>X</b> chuyền · <b>Z</b> xoạc bóng.</p>
          <p>Chiêu cuối hất ngã mọi người trên đường bay, kể cả thủ môn!</p>
        </div>
        <button disabled={picked.length !== 3} onClick={() => { setScore([0, 0]); setStage('play'); }}
          className="rounded-full bg-green-500 py-3 text-lg font-bold text-white shadow-lg disabled:opacity-40">
          ▶ Vào trận{preview ? ' (phụ huynh chơi, không giới hạn giờ)' : ''}
        </button>
      </div>
    );
  }

  const m = Number.isFinite(secondsLeft) ? `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}` : '∞';
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-2">
      <div className="flex items-center justify-between rounded-xl bg-white px-4 py-2 text-lg font-black shadow">
        <span style={{ color: TEAM[0] }}>Bạn {score[0]}</span>
        <span>⏱️ {m}{preview && ' (chơi thử)'}</span>
        <span style={{ color: TEAM[1] }}>{score[1]} Máy</span>
      </div>
      <canvas ref={canvasRef} width={W} height={H} className="w-full touch-none select-none rounded-xl border-4 border-white shadow-xl" />
      <div className="flex items-center justify-between gap-3 select-none">
        <div className="grid grid-cols-3 grid-rows-3 gap-1 [&>button]:h-11 [&>button]:w-11 [&>button]:touch-none [&>button]:rounded-xl [&>button]:bg-white [&>button]:text-lg [&>button]:font-black [&>button]:shadow">
          <span /><button {...hold('up')}>▲</button><span />
          <button {...hold('left')}>◀</button><span /><button {...hold('right')}>▶</button>
          <span /><button {...hold('down')}>▼</button><span />
        </div>
        <div className="flex gap-2 [&>button]:touch-none [&>button]:rounded-full [&>button]:px-4 [&>button]:py-4 [&>button]:text-sm [&>button]:font-black [&>button]:text-white [&>button]:shadow-lg">
          <button className="!bg-sky-500" {...hold('pass')}>🎯 Chuyền</button>
          <button className="!bg-orange-500" {...hold('tackle')}>💥 Xoạc</button>
          <button className="!bg-red-500" {...hold('shoot')}>⚽ Sút</button>
        </div>
      </div>
    </div>
  );
}

