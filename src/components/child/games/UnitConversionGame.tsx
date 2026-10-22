"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

// Each pair is a direct multiply-by factor from `from` to `to`
// (value_in_from * factor = value_in_to). Kept to the metric units a
// primary-school child actually meets: length, area, mass, volume.
type Pair = { from: string; to: string; factor: number };

const PAIRS: Pair[] = [
  { from: "m", to: "cm", factor: 100 },
  { from: "cm", to: "m", factor: 0.01 },
  { from: "km", to: "m", factor: 1000 },
  { from: "m", to: "km", factor: 0.001 },
  { from: "m²", to: "cm²", factor: 10000 },
  { from: "ha", to: "m²", factor: 10000 },
  { from: "km²", to: "ha", factor: 100 },
  { from: "kg", to: "g", factor: 1000 },
  { from: "g", to: "kg", factor: 0.001 },
  { from: "ml", to: "l", factor: 0.001 },
  { from: "l", to: "ml", factor: 1000 },
];

// Keeps generated numbers friendly (no 0.0034 or 123456789) by picking from a
// short list of round starting values per factor size, instead of a raw
// random range.
function friendlyValue(factor: number): number {
  const smallRound = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25];
  const bigRound = [100, 200, 250, 300, 500, 1000, 1500, 2000];
  const pool = factor >= 1000 || factor <= 0.001 ? bigRound : smallRound;
  return pool[Math.floor(Math.random() * pool.length)];
}

function roundNice(n: number): number {
  return Math.round(n * 1000) / 1000;
}

type Question = {
  value: number;
  from: string;
  to: string;
  answer: number;
  choices: number[];
};

function makeQuestion(): Question {
  const pair = PAIRS[Math.floor(Math.random() * PAIRS.length)];
  const value = friendlyValue(pair.factor);
  const answer = roundNice(value * pair.factor);

  const distractors = new Set<number>([answer]);
  while (distractors.size < 4) {
    const wobble = (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 3));
    const bad = roundNice(answer + wobble * (answer === 0 ? 1 : answer) * (Math.random() < 0.5 ? 0.1 : 1));
    if (bad !== answer && bad > 0) distractors.add(roundNice(bad));
  }
  const choices = Array.from(distractors).sort(() => Math.random() - 0.5);

  return { value, from: pair.from, to: pair.to, answer, choices };
}

const ROUND_LENGTH = 10;
const LIVES_START = 3;
const QUESTION_SECONDS = 7;
const QUICK_ANSWER_SECONDS = 2.5;
const QUICK_BONUS = 5;
const STREAK_BONUS_AT = 2;

type Phase = "ready" | "playing" | "done";

// Potion color deepens as the streak grows, like a brew getting stronger —
// pure cosmetic feedback, no gameplay effect.
function potionColor(streak: number): string {
  if (streak >= 5) return "linear-gradient(180deg,#ffc93c,#ff9f45)";
  if (streak >= 3) return "linear-gradient(180deg,#b983ff,#9c6be0)";
  if (streak >= STREAK_BONUS_AT) return "linear-gradient(180deg,#6ba8ff,#4d96ff)";
  return "linear-gradient(180deg,#8be89b,#6bcb77)";
}

type Spark = { style: CSSProperties };
const SPARK_COLORS = ["#6BCB77", "#4D96FF", "#FFC93C", "#B983FF", "#FF9F45"];

function makeSparks(): Spark[] {
  return Array.from({ length: 10 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 26 + Math.random() * 38;
    const color = SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)];
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - 14;
    const rot = Math.round(Math.random() * 360);
    const delay = Math.round(Math.random() * 80);
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

export default function UnitConversionGame() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [qIndex, setQIndex] = useState(0);
  const [question, setQuestion] = useState<Question>(() => makeQuestion());
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [lives, setLives] = useState(LIVES_START);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [quickBonus, setQuickBonus] = useState(false);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);

  const answeredRef = useRef(false);
  const deadlineRef = useRef(0);

  const title = useMemo(() => "🧪 Unit Lab", []);

  function start() {
    setPhase("playing");
    setQIndex(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setLives(LIVES_START);
    setFeedback(null);
    setPicked(null);
    setQuickBonus(false);
    setSparks([]);
    setQuestion(makeQuestion());
    answeredRef.current = false;
  }

  function advance(nextLives: number) {
    setTimeout(() => {
      if (nextLives <= 0 || qIndex + 1 >= ROUND_LENGTH) {
        setPhase("done");
        return;
      }
      setQIndex((i) => i + 1);
      setQuestion(makeQuestion());
      setFeedback(null);
      setPicked(null);
      setQuickBonus(false);
      setSparks([]);
      answeredRef.current = false;
    }, 950);
  }

  function handleTimeout() {
    if (feedback || answeredRef.current) return;
    answeredRef.current = true;
    setPicked(null);
    setFeedback("wrong");
    setStreak(0);
    const nextLives = lives - 1;
    setLives(nextLives);
    advance(nextLives);
  }

  // Runs the per-question countdown. Only a fresh question (or restart)
  // should reset the clock, so it's keyed on qIndex/phase, not on feedback —
  // once an answer lands, `answeredRef` stops the timeout callback from
  // double-processing before the next question's effect replaces it. The
  // displayed number is only ever written from inside the interval's own
  // callback (never as a bare statement in the effect body), so the first
  // tick lands up to 100ms after the question changes.
  useEffect(() => {
    if (phase !== "playing") return;
    deadlineRef.current = Date.now() + QUESTION_SECONDS * 1000;
    const id = setInterval(() => {
      const remaining = Math.max(0, (deadlineRef.current - Date.now()) / 1000);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(id);
        handleTimeout();
      }
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, qIndex]);

  function choose(choice: number) {
    if (feedback || answeredRef.current) return;
    answeredRef.current = true;
    const isCorrect = choice === question.answer;
    const quick = isCorrect && QUESTION_SECONDS - timeLeft <= QUICK_ANSWER_SECONDS;
    setPicked(choice);
    setFeedback(isCorrect ? "correct" : "wrong");

    if (isCorrect) {
      setStreak((s) => {
        const next = s + 1;
        setBestStreak((b) => Math.max(b, next));
        return next;
      });
      setScore((s) => s + (streak >= STREAK_BONUS_AT ? 15 : 10) + (quick ? QUICK_BONUS : 0));
      setCorrectCount((c) => c + 1);
      setQuickBonus(quick);
      setSparks(makeSparks());
      advance(lives);
    } else {
      setStreak(0);
      const nextLives = lives - 1;
      setLives(nextLives);
      advance(nextLives);
    }
  }

  const flaskPct = Math.min(100, Math.round((correctCount / ROUND_LENGTH) * 100));
  const ringDeg = Math.max(0, Math.min(1, timeLeft / QUESTION_SECONDS)) * 360;
  const ringLow = timeLeft <= 2.5 && !feedback;
  const busted = phase === "done" && lives <= 0;

  return (
    <div className="flex flex-col gap-4 rounded-[22px] bg-white p-5 shadow-md">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[17px] font-bold text-green-text">{title}</h3>
        {phase === "playing" && (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-green-tint px-3 py-1 font-display text-[13px] font-bold text-green-text">
              ⭐ {score}
            </span>
            <span className="font-display text-[14px]" aria-label={`${lives} lives left`}>
              {Array.from({ length: LIVES_START }, (_, i) => (i < lives ? "❤️" : "🖤")).join("")}
            </span>
          </div>
        )}
      </div>

      {phase === "ready" && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-[14.5px] font-semibold text-muted">
            Brew the right potion! Convert between metric units before the timer runs out —
            miss three and the lab goes boom. 🧪💥
          </p>
          <button
            onClick={start}
            className="rounded-2xl bg-green px-6 py-3 font-display text-[15px] font-bold text-white shadow-md"
          >
            Start
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-stretch gap-3">
            {/* Potion flask: fills up with the round's correct answers. */}
            <div className="relative flex h-[132px] w-11 flex-shrink-0 items-end overflow-hidden rounded-b-[18px] rounded-t-md border-2 border-divider bg-divider/60">
              <div
                className="w-full transition-[height] duration-500 ease-out"
                style={{ height: `${Math.max(6, flaskPct)}%`, background: potionColor(streak) }}
              />
              <span className="absolute left-1/2 top-1 -translate-x-1/2 animate-[floatBlob_3s_ease-in-out_infinite] text-[12px]">
                🧪
              </span>
            </div>

            <div
              className={`relative flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl bg-green-tint px-4 py-4 text-center ${
                feedback === "wrong" ? "animate-[shake_0.4s_ease-in-out]" : ""
              }`}
            >
              <p className="font-display text-[22px] font-extrabold">
                {question.value} {question.from} = ? {question.to}
              </p>
              {quickBonus && feedback === "correct" && (
                <span className="font-display text-[11.5px] font-bold text-orange">⚡ Quick! +{QUICK_BONUS}</span>
              )}
              {sparks.map((p, i) => (
                <span
                  key={i}
                  style={p.style}
                  className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-sm animate-[confetti-fly_0.8s_ease-out_forwards]"
                />
              ))}
            </div>

            {/* Countdown ring: shrinking arc, turns coral when time is almost up. */}
            <div
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center self-center rounded-full"
              style={{
                background: `conic-gradient(${ringLow ? "var(--color-coral)" : "var(--color-green)"} ${ringDeg}deg, var(--color-divider) ${ringDeg}deg)`,
              }}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white font-display text-[13px] font-extrabold">
                {Math.ceil(timeLeft)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {question.choices.map((choice) => {
              const isPicked = picked === choice;
              let style = "bg-divider text-ink";
              if (feedback && isPicked) {
                style = feedback === "correct" ? "bg-green text-white" : "bg-coral text-white";
              } else if (feedback && choice === question.answer) {
                style = "bg-green-tint text-green-text";
              }
              return (
                <button
                  key={choice}
                  onClick={() => choose(choice)}
                  disabled={!!feedback}
                  className={`rounded-2xl px-4 py-3 font-display text-[16px] font-bold transition-colors ${style}`}
                >
                  {choice}
                </button>
              );
            })}
          </div>
          <p className="text-center text-[12px] font-bold uppercase tracking-wide text-muted">
            Question {qIndex + 1} / {ROUND_LENGTH} {streak >= STREAK_BONUS_AT ? `🔥 x${streak} combo!` : ""}
          </p>
        </div>
      )}

      {phase === "done" && (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <p className="font-display text-[22px] font-extrabold text-green-text">
            {busted ? "The lab went boom! 💥" : "Potion complete! 🎉"}
          </p>
          <div className="flex gap-3">
            <Stat label="Score" value={score} />
            <Stat label="Best combo" value={`🔥${bestStreak}`} />
            <Stat label="Flask" value={`${flaskPct}%`} />
          </div>
          <button
            onClick={start}
            className="rounded-2xl bg-green px-6 py-3 font-display text-[15px] font-bold text-white shadow-md"
          >
            Play again
          </button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-divider px-4 py-2">
      <span className="font-display text-[20px] font-extrabold text-green-text">{value}</span>
      <span className="text-[11px] font-bold uppercase tracking-wide text-muted">{label}</span>
    </div>
  );
}
