'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { sfx } from '@/lib/sfx';
import { getCredit, setCredit } from '@/lib/mathfun/footballCredit';

type Phase = 'aim' | 'power' | 'kicking' | 'result';
type Outcome = 'goal' | 'save' | 'miss';
type Col = 'left' | 'center' | 'right';

const KEEPER_X: Record<Col, number> = { left: 30, center: 50, right: 70 };

function colOf(ax: number): Col {
  return ax < 33 ? 'left' : ax < 66 ? 'center' : 'right';
}

function randomCol(): Col {
  const cols: Col[] = ['left', 'center', 'right'];
  return cols[Math.floor(Math.random() * cols.length)];
}

function BodyFigure({ jersey, size = 1, legPose = 'idle', armsOut = false }: {
  jersey: string; size?: number; legPose?: 'idle' | 'kick' | 'run'; armsOut?: boolean;
}) {
  const s = (n: number) => n * size;
  const armAngle = armsOut ? 55 : legPose === 'kick' ? 35 : 15;
  return (
    <div className="relative" style={{ width: s(32), height: s(46) }}>
      {/* ground shadow */}
      <div
        className="absolute rounded-full bg-black/20"
        style={{ width: s(22), height: s(6), left: s(5), top: s(41) }}
      />

      {/* arms */}
      <div
        className="absolute rounded-full border border-white/70 transition-transform duration-200"
        style={{ background: jersey, width: s(8), height: s(17), left: s(-3), top: s(13), transformOrigin: `${s(4)}px ${s(2)}px`, transform: `rotate(${-armAngle}deg)` }}
      />
      <div
        className="absolute rounded-full border border-white/70 transition-transform duration-200"
        style={{ background: jersey, width: s(8), height: s(17), right: s(-3), top: s(13), transformOrigin: `${s(4)}px ${s(2)}px`, transform: `rotate(${armAngle}deg)` }}
      />

      {/* legs */}
      <div
        className={`absolute rounded-full transition-transform duration-200 ${legPose === 'kick' ? '-rotate-[55deg]' : legPose === 'run' ? 'rotate-12' : ''}`}
        style={{ background: '#3a2a1a', width: s(8), height: s(19), left: s(6), top: s(28), transformOrigin: 'top center' }}
      />
      <div
        className={`absolute rounded-full transition-transform duration-200 ${legPose === 'kick' ? 'rotate-12' : legPose === 'run' ? '-rotate-12' : ''}`}
        style={{ background: '#3a2a1a', width: s(8), height: s(19), right: s(6), top: s(28), transformOrigin: 'top center' }}
      />

      {/* shorts */}
      <div
        className="absolute rounded-lg border-2 border-white"
        style={{ background: jersey, filter: 'brightness(0.65)', width: s(22), height: s(10), left: s(5), top: s(24) }}
      />

      {/* torso / jersey */}
      <div
        className="absolute rounded-2xl border-2 border-white shadow-sm"
        style={{ background: jersey, width: s(24), height: s(19), left: s(4), top: s(9) }}
      />

      {/* head */}
      <div
        className="absolute rounded-full border-2 border-amber-600"
        style={{ background: '#f1c27d', width: s(17), height: s(17), left: s(7.5), top: s(-2) }}
      />
    </div>
  );
}

/** preview = parent view: no time limit, nothing is spent. */
export default function FootballGame({ preview = false }: { preview?: boolean }) {
  const [phase, setPhase] = useState<Phase>('aim');
  const [secondsLeft, setSecondsLeft] = useState<number | null>(preview ? Infinity : null);
  const [score, setScore] = useState(0);
  const [aim, setAim] = useState({ ax: 50, ay: 30 });
  const [powerPos, setPowerPos] = useState(50);
  const [ballTarget, setBallTarget] = useState({ left: 50, top: 78 });
  const [keeperLeft, setKeeperLeft] = useState(50);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const powerStart = useRef(0);

  // Spend earned play time while the game is open; persisted every second so a refresh can't reset it.
  useEffect(() => {
    if (preview) return;
    let left = getCredit();
    setSecondsLeft(left); // eslint-disable-line react-hooks/set-state-in-effect -- localStorage is only readable after mount
    if (left <= 0) return;
    const id = setInterval(() => {
      left -= 1;
      setCredit(left);
      setSecondsLeft(left);
      if (left <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [preview]);

  const goalLeftPct = (ax: number) => 20 + (ax / 100) * 60;
  const goalTopPct = (ay: number) => 5 + (ay / 100) * 45;

  // power bar oscillation
  useEffect(() => {
    if (phase !== 'power') return;
    powerStart.current = performance.now();
    const id = setInterval(() => {
      const elapsed = performance.now() - powerStart.current;
      setPowerPos((Math.sin(elapsed / 300) + 1) * 50);
    }, 16);
    return () => clearInterval(id);
  }, [phase]);

  const moveAim = useCallback((dx: number, dy: number) => {
    setAim(a => ({
      ax: Math.min(92, Math.max(8, a.ax + dx)),
      ay: Math.min(92, Math.max(8, a.ay + dy)),
    }));
  }, []);

  const confirmAim = useCallback(() => {
    setPhase('power');
  }, []);

  const resolveShot = useCallback((power: number) => {
    const ballCol = colOf(aim.ax);
    const isMissZone = power < 12 || power > 90;

    setBallTarget({ left: goalLeftPct(aim.ax), top: goalTopPct(aim.ay) });

    let result: Outcome;
    if (isMissZone) {
      result = 'miss';
      setKeeperLeft(KEEPER_X[randomCol()]);
    } else {
      const keeperCol = Math.random() < 0.2 ? ballCol : randomCol();
      setKeeperLeft(KEEPER_X[keeperCol]);
      const matched = keeperCol === ballCol;
      const isHigh = aim.ay < 40;
      if (matched) {
        result = isHigh && Math.random() < 0.3 ? 'goal' : 'save';
      } else {
        result = 'goal';
      }
    }

    sfx.kick();
    setPhase('kicking');
    setTimeout(() => {
      setOutcome(result);
      setPhase('result');
      if (result === 'goal') { sfx.goal(); setScore(s => s + 1); }
      else sfx.save();

      setTimeout(() => {
        setAim({ ax: 50, ay: 30 });
        setBallTarget({ left: 50, top: 78 });
        setKeeperLeft(50);
        setOutcome(null);
        setPhase('aim');
      }, 1600);
    }, 600);
  }, [aim]);

  const lockPower = useCallback(() => {
    resolveShot(powerPos);
  }, [powerPos, resolveShot]);

  // keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase === 'aim') {
        if (e.code === 'ArrowLeft') moveAim(-6, 0);
        else if (e.code === 'ArrowRight') moveAim(6, 0);
        else if (e.code === 'ArrowUp') moveAim(0, -8);
        else if (e.code === 'ArrowDown') moveAim(0, 8);
        else if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); confirmAim(); }
      } else if (phase === 'power') {
        if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); lockPower(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, moveAim, confirmAim, lockPower]);

  const handleGoalTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (phase !== 'aim' || !fieldRef.current) return;
    const rect = fieldRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    const ax = Math.min(92, Math.max(8, ((px - 20) / 60) * 100));
    const ay = Math.min(92, Math.max(8, ((py - 5) / 45) * 100));
    setAim({ ax, ay });
    confirmAim();
  };

  if (secondsLeft === null) return <p className="text-center font-semibold text-gray-500">Đang tải…</p>;

  if (secondsLeft <= 0) {
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-white p-10 text-center shadow-xl">
        <h2 className="mb-2 text-2xl font-bold text-green-700">⏱️ Hết giờ chơi rồi!</h2>
        <p className="mb-6 font-semibold text-gray-600">Làm xong một bài toán đạt 100 điểm để được chơi thêm 5 phút nhé.</p>
        <Link href="/mathfun/practice" className="rounded-full bg-green-500 px-8 py-3 text-lg font-bold text-white shadow-lg">
          ➕ Đi làm toán
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl w-full mx-auto">
      <div className="flex justify-between items-center mb-3 text-lg font-bold text-green-800">
        <span>{preview ? '👀 Phụ huynh xem thử (không giới hạn giờ)' : `⏱️ ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`}</span>
        <span>⚽ {score}</span>
      </div>

      <div
        ref={fieldRef}
        onClick={handleGoalTap}
        className="relative w-full h-80 sm:h-96 rounded-xl overflow-hidden shadow-xl border-4 border-white cursor-pointer select-none"
        style={{ background: 'linear-gradient(to bottom, #dff5e1 0%, #7cc576 45%, #5fb356 100%)' }}
      >
        {/* goal */}
        <div
          className="absolute border-4 border-white bg-white/10"
          style={{ left: '20%', top: '5%', width: '60%', height: '45%', backgroundImage:
            'repeating-linear-gradient(90deg, rgba(255,255,255,.4) 0 1px, transparent 1px 10%), repeating-linear-gradient(0deg, rgba(255,255,255,.4) 0 1px, transparent 1px 20%)' }}
        />

        {/* aim reticle */}
        {phase === 'aim' && (
          <div
            className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full border-4 border-yellow-400 animate-pulse"
            style={{ left: `${goalLeftPct(aim.ax)}%`, top: `${goalTopPct(aim.ay)}%` }}
          />
        )}

        {/* keeper */}
        <div
          className={`absolute -ml-5 -mt-2 transition-all duration-500 ease-out ${
            phase === 'kicking' || phase === 'result' ? (keeperLeft < 50 ? '-rotate-12' : keeperLeft > 50 ? 'rotate-12' : '') : ''
          }`}
          style={{ left: `${keeperLeft}%`, top: '14%' }}
        >
          <BodyFigure jersey="#d69e2e" size={1.15} armsOut />
        </div>

        {/* kicker */}
        <div
          className={`absolute -ml-4 -mt-10 transition-transform duration-300 ${phase === 'kicking' ? '-translate-y-1' : ''}`}
          style={{ left: '50%', top: '78%' }}
        >
          <BodyFigure jersey="#3182ce" legPose={phase === 'kicking' ? 'kick' : 'idle'} />
        </div>

        {/* ball */}
        <div
          className="absolute text-3xl -ml-3 -mt-3 transition-all duration-500 ease-in"
          style={{ left: `${ballTarget.left}%`, top: `${ballTarget.top}%` }}
        >
          ⚽
        </div>

        {/* result banner */}
        {phase === 'result' && outcome && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <span className="text-4xl font-extrabold text-white drop-shadow-lg">
              {outcome === 'goal' ? '⚽ GOAL!' : outcome === 'save' ? '🧤 SAVED!' : '😬 MISSED!'}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 bg-white rounded-xl shadow p-4">
        {phase === 'aim' && (
          <div className="text-center">
            <p className="font-semibold text-gray-700 mb-3">Tap the goal to aim — or use arrow keys, then Space to confirm.</p>
            <button
              onClick={confirmAim}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-2 px-6 rounded-full shadow transition"
            >
              ✅ Confirm Aim
            </button>
          </div>
        )}
        {phase === 'power' && (
          <div className="text-center">
            <p className="font-semibold text-gray-700 mb-2">Tap KICK when the bar is in the green zone!</p>
            <div className="relative w-full h-6 rounded-full overflow-hidden bg-gray-200 mb-3">
              <div className="absolute inset-y-0 left-0 bg-red-400" style={{ width: '12%' }} />
              <div className="absolute inset-y-0 bg-green-400" style={{ left: '12%', width: '78%' }} />
              <div className="absolute inset-y-0 right-0 bg-red-400" style={{ width: '10%' }} />
              <div
                className="absolute top-0 bottom-0 w-2 bg-gray-900 rounded"
                style={{ left: `${powerPos}%` }}
              />
            </div>
            <button
              onClick={lockPower}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-10 rounded-full text-lg shadow-lg transition"
            >
              🦶 KICK!
            </button>
          </div>
        )}
        {(phase === 'kicking' || phase === 'result') && (
          <p className="text-center font-semibold text-gray-500">⚽ Here we go...</p>
        )}
      </div>
    </div>
  );
}
