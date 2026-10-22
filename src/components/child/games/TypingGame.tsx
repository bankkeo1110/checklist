"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// Short, kid-friendly English words and phrases — plain vocabulary a child
// reviewing basic English would already recognize, so the game drills
// typing speed/accuracy rather than teaching new words.
const PROMPTS = [
  "cat", "dog", "sun", "moon", "star", "tree", "book", "fish", "bird", "milk",
  "apple", "happy", "friend", "school", "water", "green", "orange", "yellow",
  "garden", "dinner", "I like dogs", "the sun is hot", "she can swim",
  "we play together", "my dog is fast", "the sky is blue", "I eat an apple",
  "cats like fish", "the book is fun", "birds can fly high",
];

const ROUND_LENGTH = 10;
const TIME_LIMIT_SECONDS = 45;

function pickRound(): string[] {
  const shuffled = [...PROMPTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, ROUND_LENGTH);
}

type Phase = "ready" | "playing" | "done";

export default function TypingGame() {
  const [round, setRound] = useState<string[]>(() => pickRound());
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<Phase>("ready");
  const [correctChars, setCorrectChars] = useState(0);
  const [totalChars, setTotalChars] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SECONDS);
  const inputRef = useRef<HTMLInputElement>(null);
  const startedAt = useRef<number>(0);

  const target = round[index] ?? "";

  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          setPhase("done");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  function start() {
    setRound(pickRound());
    setIndex(0);
    setTyped("");
    setCorrectChars(0);
    setTotalChars(0);
    setMistakes(0);
    setCompleted(0);
    setTimeLeft(TIME_LIMIT_SECONDS);
    setPhase("playing");
    startedAt.current = Date.now();
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function handleChange(value: string) {
    if (phase !== "playing") return;
    setTyped(value);

    if (value === target) {
      let correct = 0;
      for (let i = 0; i < target.length; i++) if (target[i] === value[i]) correct++;
      setCorrectChars((c) => c + correct);
      setTotalChars((c) => c + target.length);
      setCompleted((c) => c + 1);
      setTyped("");
      if (index + 1 >= round.length) {
        setPhase("done");
      } else {
        setIndex((i) => i + 1);
      }
    }
  }

  function handleMistakeCheck(value: string) {
    // Count a mistake the moment a typed character diverges from the target,
    // without blocking further typing — the child sees red immediately and
    // backspaces to fix it themselves.
    for (let i = 0; i < value.length; i++) {
      if (value[i] !== target[i]) {
        setMistakes((m) => m + 1);
        break;
      }
    }
  }

  const elapsedMinutes = Math.max((TIME_LIMIT_SECONDS - timeLeft) / 60, 1 / 60);
  const wpm = Math.round((correctChars / 5) / elapsedMinutes) || 0;
  const accuracy = totalChars + mistakes > 0 ? Math.round((totalChars / (totalChars + mistakes)) * 100) : 100;

  return (
    <div className="flex flex-col gap-4 rounded-[22px] bg-white p-5 shadow-md">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[17px] font-bold text-blue-text">⌨️ Typing Race</h3>
        {phase === "playing" && (
          <span className="rounded-full bg-blue-tint px-3 py-1 font-display text-[13px] font-bold text-blue-text">
            ⏱ {timeLeft}s
          </span>
        )}
      </div>

      {phase === "ready" && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-[14.5px] font-semibold text-muted">
            Type each English word or sentence exactly as shown, as fast as you can,
            before the clock runs out!
          </p>
          <button
            onClick={start}
            className="rounded-2xl bg-blue px-6 py-3 font-display text-[15px] font-bold text-white shadow-md"
          >
            Start
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl bg-blue-tint px-4 py-5 text-center">
            <PromptDisplay target={target} typed={typed} />
          </div>
          <input
            ref={inputRef}
            value={typed}
            onChange={(e) => {
              handleMistakeCheck(e.target.value);
              handleChange(e.target.value);
            }}
            autoFocus
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="rounded-2xl border-2 border-divider bg-white px-4 py-3 text-center text-[18px] font-bold text-ink outline-none focus:border-blue"
            placeholder="Type here…"
          />
          <p className="text-center text-[12px] font-bold uppercase tracking-wide text-muted">
            Word {index + 1} / {round.length}
          </p>
        </div>
      )}

      {phase === "done" && (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <p className="font-display text-[22px] font-extrabold text-green-text">Nice typing! 🎉</p>
          <div className="flex gap-4">
            <Stat label="WPM" value={wpm} />
            <Stat label="Accuracy" value={`${accuracy}%`} />
            <Stat label="Words" value={`${completed}/${round.length}`} />
          </div>
          <button
            onClick={start}
            className="rounded-2xl bg-blue px-6 py-3 font-display text-[15px] font-bold text-white shadow-md"
          >
            Play again
          </button>
        </div>
      )}
    </div>
  );
}

function PromptDisplay({ target, typed }: { target: string; typed: string }) {
  const chars = useMemo(() => target.split(""), [target]);
  return (
    <p className="font-display text-[22px] font-extrabold tracking-wide">
      {chars.map((ch, i) => {
        let color = "text-ink";
        if (i < typed.length) {
          color = typed[i] === ch ? "text-green-text" : "text-coral-text";
        }
        return (
          <span key={i} className={color}>
            {ch}
          </span>
        );
      })}
    </p>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-divider px-4 py-2">
      <span className="font-display text-[20px] font-extrabold text-blue-text">{value}</span>
      <span className="text-[11px] font-bold uppercase tracking-wide text-muted">{label}</span>
    </div>
  );
}
