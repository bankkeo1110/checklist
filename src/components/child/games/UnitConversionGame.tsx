"use client";

import { useMemo, useState } from "react";

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

type Phase = "ready" | "playing" | "done";

export default function UnitConversionGame() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [qIndex, setQIndex] = useState(0);
  const [question, setQuestion] = useState<Question>(() => makeQuestion());
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [picked, setPicked] = useState<number | null>(null);

  const title = useMemo(() => "📏 Unit Convert", []);

  function start() {
    setPhase("playing");
    setQIndex(0);
    setScore(0);
    setStreak(0);
    setFeedback(null);
    setPicked(null);
    setQuestion(makeQuestion());
  }

  function choose(choice: number) {
    if (feedback) return;
    const isCorrect = choice === question.answer;
    setPicked(choice);
    setFeedback(isCorrect ? "correct" : "wrong");
    if (isCorrect) {
      setStreak((s) => s + 1);
      setScore((s) => s + (streak >= 2 ? 15 : 10));
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      if (qIndex + 1 >= ROUND_LENGTH) {
        setPhase("done");
      } else {
        setQIndex((i) => i + 1);
        setQuestion(makeQuestion());
        setFeedback(null);
        setPicked(null);
      }
    }, 900);
  }

  return (
    <div className="flex flex-col gap-4 rounded-[22px] bg-white p-5 shadow-md">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[17px] font-bold text-green-text">{title}</h3>
        {phase === "playing" && (
          <span className="rounded-full bg-green-tint px-3 py-1 font-display text-[13px] font-bold text-green-text">
            ⭐ {score}
          </span>
        )}
      </div>

      {phase === "ready" && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-[14.5px] font-semibold text-muted">
            Convert between metric units — length, area, mass and volume.
            Pick the right answer before moving on!
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
          <div className="rounded-2xl bg-green-tint px-4 py-5 text-center">
            <p className="font-display text-[22px] font-extrabold">
              {question.value} {question.from} = ? {question.to}
            </p>
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
            Question {qIndex + 1} / {ROUND_LENGTH} {streak >= 2 && feedback !== "wrong" ? "🔥 streak bonus!" : ""}
          </p>
        </div>
      )}

      {phase === "done" && (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <p className="font-display text-[22px] font-extrabold text-green-text">Great job! 🎉</p>
          <div className="flex gap-4">
            <Stat label="Score" value={score} />
            <Stat label="Questions" value={ROUND_LENGTH} />
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
