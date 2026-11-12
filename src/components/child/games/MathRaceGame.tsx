'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { generateQuestion, type Question } from '@/lib/mathfun/questions';
import { LESSONS } from '@/lib/mathfun/curriculum';
import { ISLANDS } from '@/lib/mathfun/islands';
import { POWERS, STREAK_FOR_POWER, VH, VW, answer, drain, newRace, stars, step, type Race } from '@/lib/race/sim';
import { CARS, carById, type CarModel } from '@/lib/race/cars';
import { draw, drawCarThumb, newView, onEvents } from './raceDraw';
import MathText from '@/components/mathfun/MathText';
import { sfx } from '@/lib/sfx';

const SCALE = 2;
const LAST_KEY = 'mathrace.stage';
const CAR_KEY = 'mathrace.car';

function CarThumb({ car }: { car: CarModel }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    drawCarThumb(ctx, car, 130, 76);
  }, [car]);
  return <canvas ref={ref} width={260} height={152} className="h-[76px] w-[130px] max-w-full" />;
}

type Phase = 'pick' | 'race' | 'done';

export default function MathRaceGame() {
  const [phase, setPhase] = useState<Phase>('pick');
  const [stage, setStage] = useState(LESSONS[0].id);
  const [carId, setCarId] = useState(CARS[0].id);
  const [question, setQuestion] = useState<Question | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ won: boolean; score: number; coins: number; correct: number; wrong: number; best: number; stars: number } | null>(null);
  const [hud, setHud] = useState({ streak: 0, power: '' });
  const [run, setRun] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raceRef = useRef<Race | null>(null);
  const nextTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lesson = LESSONS.find((l) => l.id === stage) ?? LESSONS[0];
  const island = ISLANDS.find((i) => i.lessonIds.includes(stage));

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAST_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after mount
      if (saved && LESSONS.some((l) => l.id === saved)) setStage(saved);
       
      setCarId(carById(localStorage.getItem(CAR_KEY)).id);
    } catch { /* storage blocked */ }
  }, []);

  useEffect(() => () => { if (nextTimer.current) clearTimeout(nextTimer.current); }, []);

  const ask = useCallback((topic: string) => {
    setQuestion(generateQuestion(topic));
    setChosen(null);
  }, []);

  // the race loop: 60 Hz simulation, drawn every animation frame
  useEffect(() => {
    if (phase !== 'race') return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const r = newRace(stage, island?.n ?? 1);
    raceRef.current = r;
    const others = CARS.filter((c) => c.id !== carId);
    const v = newView(carById(carId), others[Math.floor(Math.random() * others.length)]);
    let last = performance.now(), acc = 0, raf = 0;
    const loop = (now: number) => {
      acc += Math.min(100, now - last); last = now;
      while (acc >= 1000 / 60) { step(r); acc -= 1000 / 60; }
      {
        const evs = drain(r);
        onEvents(v, evs, 300 + 28 - r.fly * 110);
        for (const e of evs) {
          if (e.t === 'coin') sfx.coin();
          else if (e.t === 'power') { sfx.power(); setHud((h) => ({ ...h, power: e.power!.id })); }
          else if (e.t === 'bump') sfx.thud();
          else if (e.t === 'finish') {
            sfx.fulltime();
            setSummary({ won: r.won, score: r.score, coins: r.coins, correct: r.correct, wrong: r.wrong, best: r.bestStreak, stars: stars(r) });
            setPhase('done');
          }
        }
      }
      setHud((h) => (h.streak === r.streak ? h : { ...h, streak: r.streak }));
      draw(ctx, r, v, SCALE);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    ask(stage);
    return () => cancelAnimationFrame(raf);
  }, [phase, stage, island, run, ask, carId]);

  const start = (topic: string) => {
    setStage(topic);
    try { localStorage.setItem(LAST_KEY, topic); } catch { /* storage blocked */ }
    setSummary(null); setHud({ streak: 0, power: '' });
    setRun((n) => n + 1);
    setPhase('race');
  };

  const pick = (choice: string) => {
    const r = raceRef.current;
    if (!r || chosen || !question) return;
    setChosen(choice);
    const ok = choice === question.answer;
    answer(r, ok);
    if (ok) sfx.correct(); else sfx.wrong();
    if (nextTimer.current) clearTimeout(nextTimer.current);
    nextTimer.current = setTimeout(() => ask(stage), ok ? 550 : 1700);
  };

  /* ── STAGE PICKER ── */
  if (phase === 'pick') {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <div className="text-center">
          <h2 className="text-2xl font-black">🏎️ Đường đua toán học</h2>
          <p className="text-sm font-semibold text-gray-600">
            Mỗi chặng là một bài toán lớp 5. Trả lời đúng để xe chạy nhanh hơn và vượt đối thủ —
            đúng <b>{STREAK_FOR_POWER} câu liên tiếp</b> là được một bảo bối!
          </p>
        </div>

        <div className="rounded-2xl bg-white p-3 shadow">
          <p className="mb-2 text-center text-sm font-black">10 bảo bối có thể nhận</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-3">
            {POWERS.map((p) => (
              <div key={p.id} className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600">
                <span className="text-base">{p.emoji}</span><span style={{ color: p.color, filter: 'brightness(.75)' }}>{p.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-3 shadow">
          <p className="mb-2 text-center text-sm font-black">🚗 Ga-ra — chọn xe của bạn</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {CARS.map((c) => (
              <button key={c.id} aria-pressed={c.id === carId} title={c.blurb}
                onClick={() => { setCarId(c.id); try { localStorage.setItem(CAR_KEY, c.id); } catch { /* storage blocked */ } }}
                className={`flex flex-col items-center rounded-xl border-4 bg-gradient-to-b from-sky-50 to-slate-100 p-1 transition ${c.id === carId ? 'border-yellow-400 shadow-lg' : 'border-transparent opacity-75 hover:opacity-100'}`}>
                <CarThumb car={c} />
                <span className="text-[11px] font-black leading-tight">{c.name}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-center text-xs font-semibold text-gray-500">{carById(carId).name}: {carById(carId).blurb}. Xe nào cũng chạy nhanh như nhau — thắng thua là do trả lời đúng.</p>
        </div>

        <div className="flex flex-col gap-3">
          {ISLANDS.map((isl) => (
            <div key={isl.n} className="rounded-2xl bg-white p-3 shadow">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFD015] text-xs font-black">{isl.n}</span>
                <span className="text-sm font-black">{isl.title}</span>
                <span className="text-xs font-bold text-gray-400">
                  {LESSONS.find((l) => l.id === isl.lessonIds[0])?.semester === 1 ? 'Học kì 1' : 'Học kì 2'}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {isl.lessonIds.map((id) => {
                  const l = LESSONS.find((x) => x.id === id);
                  if (!l) return null;
                  return (
                    <button key={id} onClick={() => start(id)}
                      className={`flex items-center gap-2 rounded-xl border-2 border-[#1a1a1a] p-2.5 text-left text-sm font-black transition hover:-translate-y-0.5 ${l.color}`}>
                      <span>{l.emoji}</span>
                      <span className="min-w-0 flex-1 truncate">{l.label}</span>
                      <span className="shrink-0">🏁</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── RESULT ── */
  if (phase === 'done' && summary) {
    const order = LESSONS.findIndex((l) => l.id === stage);
    const next = LESSONS[order + 1];
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="text-6xl">{summary.won ? '🏆' : '🏁'}</div>
        <h2 className="text-2xl font-black">{summary.won ? 'VỀ NHẤT!' : 'Về nhì mất rồi…'}</h2>
        <div className="text-3xl">{'⭐'.repeat(summary.stars)}<span className="opacity-20">{'⭐'.repeat(3 - summary.stars)}</span></div>
        <p className="font-semibold text-gray-600">{lesson.emoji} {lesson.label}</p>
        <div className="grid w-full grid-cols-3 gap-2 text-sm font-black">
          <div className="rounded-xl bg-green-50 p-2"><div className="text-2xl text-green-600">{summary.correct}</div>ĐÚNG</div>
          <div className="rounded-xl bg-red-50 p-2"><div className="text-2xl text-red-500">{summary.wrong}</div>SAI</div>
          <div className="rounded-xl bg-orange-50 p-2"><div className="text-2xl text-orange-500">{summary.best}</div>CHUỖI</div>
        </div>
        <p className="text-sm font-bold text-gray-500">⭐ {summary.coins} sao · {summary.score} điểm</p>
        <div className="flex flex-wrap justify-center gap-2">
          <button onClick={() => start(stage)} className="rounded-full bg-green-500 px-6 py-3 font-bold text-white shadow-lg">🔄 Đua lại</button>
          {next && (
            <button onClick={() => start(next.id)} className="max-w-full truncate rounded-full bg-blue-500 px-6 py-3 font-bold text-white shadow-lg">
              ▶ Chặng sau: {next.emoji} {next.label}
            </button>
          )}
          <button onClick={() => setPhase('pick')} className="rounded-full bg-gray-100 px-6 py-3 font-bold text-gray-700">Đổi chặng</button>
        </div>
      </div>
    );
  }

  /* ── RACE ── */
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
      <div className="flex items-center justify-between rounded-xl bg-white px-4 py-1.5 text-sm font-black shadow">
        <span>{lesson.emoji} {lesson.label}</span>
        <button onClick={() => setPhase('pick')} className="rounded-lg bg-gray-100 px-3 py-1">Thoát</button>
      </div>

      <canvas ref={canvasRef} width={VW * SCALE} height={VH * SCALE} className="block w-full rounded-xl border-4 border-white shadow-xl" />

      <div className="rounded-2xl bg-white p-4 shadow">
        {question ? (
          <>
            <p className="mb-3 text-center text-lg font-black leading-snug">{question.question}</p>
            <div className="grid grid-cols-2 gap-2">
              {question.choices.map((c) => {
                let cls = 'border-[#1a1a1a] bg-white hover:bg-yellow-50';
                if (chosen) {
                  if (c === question.answer) cls = 'border-green-500 bg-green-100';
                  else if (c === chosen) cls = 'border-red-400 bg-red-100';
                  else cls = 'border-gray-200 bg-gray-50 opacity-50';
                }
                return (
                  <button key={c} onClick={() => pick(c)} disabled={!!chosen}
                    className={`${cls} rounded-xl border-2 py-3 text-lg font-black transition`}>
                    {c}
                  </button>
                );
              })}
            </div>
            {chosen && chosen !== question.answer && (
              <div className="mt-3 rounded-xl bg-yellow-50 p-2 text-sm font-semibold text-gray-700 [&_p]:font-semibold!">
                💡 <MathText content={question.explanation} />
              </div>
            )}
          </>
        ) : <p className="text-center font-black text-gray-400">Chuẩn bị…</p>}
        <p className="mt-2 text-center text-xs font-bold text-gray-400">
          Đúng {STREAK_FOR_POWER} câu liên tiếp = một bảo bối · đang đúng liên tiếp {hud.streak} câu
        </p>
      </div>
    </div>
  );
}
