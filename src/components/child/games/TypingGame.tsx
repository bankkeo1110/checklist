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

// A word finished faster than this (in words-per-minute, over just that one
// word) earns a nitro boost — fast enough to reward real typing speed
// without needing a perfect run.
const BOOST_WPM = 28;
// Each boost jumps the car forward by this fraction of the whole track.
const BOOST_BONUS_FRACTION = 0.05;
const BOOST_VISUAL_MS = 900;
const TRACK_TICK_MS = 150;

// Opponents race the clock at a steady pace set relative to how fast someone
// has to type, on average, to cross the finish line in time — so the race
// stays close no matter which words this round happened to draw.
const OPPONENTS = [
  { id: "rex", name: "Rex", emoji: "🚙", paceFactor: 0.72 },
  { id: "mia", name: "Mia", emoji: "🚓", paceFactor: 0.9 },
  { id: "zoe", name: "Zoe", emoji: "🚕", paceFactor: 1.08 },
];

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
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SECONDS);
  const [boostCount, setBoostCount] = useState(0);
  const [boosting, setBoosting] = useState(false);
  // Elapsed race time, refreshed from a timer rather than read from
  // Date.now()/refs during render — rendering has to stay a pure function of
  // state and props.
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const startedAt = useRef<number>(0);
  const wordStartedAt = useRef<number>(0);
  const boostUntilRef = useRef<number>(0);

  const target = round[index] ?? "";
  const trackChars = useMemo(() => round.reduce((sum, word) => sum + word.length, 0), [round]);

  // Countdown — ends the race when time runs out.
  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          setPhase("done");
          setElapsedSeconds(TIME_LIMIT_SECONDS);
          setBoosting(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  // A faster tick than the countdown, so opponent cars and the nitro flag
  // visibly update between keystrokes too.
  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => {
      const elapsed = Math.min((Date.now() - startedAt.current) / 1000, TIME_LIMIT_SECONDS);
      setElapsedSeconds(elapsed);
      setBoosting(Date.now() < boostUntilRef.current);
    }, TRACK_TICK_MS);
    return () => clearInterval(id);
  }, [phase]);

  function start() {
    setRound(pickRound());
    setIndex(0);
    setTyped("");
    setCorrectChars(0);
    setTotalChars(0);
    setMistakes(0);
    setBoostCount(0);
    setBoosting(false);
    setElapsedSeconds(0);
    boostUntilRef.current = 0;
    setTimeLeft(TIME_LIMIT_SECONDS);
    setPhase("playing");
    startedAt.current = Date.now();
    wordStartedAt.current = Date.now();
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function handleChange(value: string) {
    if (phase !== "playing") return;
    setTyped(value);

    if (value === target) {
      let correct = 0;
      for (let i = 0; i < target.length; i++) if (target[i] === value[i]) correct++;

      const wordSeconds = Math.max((Date.now() - wordStartedAt.current) / 1000, 0.1);
      const wordWpm = (target.length / 5) / (wordSeconds / 60);
      if (wordWpm >= BOOST_WPM) {
        setBoostCount((b) => b + 1);
        boostUntilRef.current = Date.now() + BOOST_VISUAL_MS;
        setBoosting(true);
      }

      setCorrectChars((c) => c + correct);
      setTotalChars((c) => c + target.length);
      setTyped("");

      if (index + 1 >= round.length) {
        setPhase("done");
        setElapsedSeconds(Math.min((Date.now() - startedAt.current) / 1000, TIME_LIMIT_SECONDS));
      } else {
        setIndex((i) => i + 1);
        wordStartedAt.current = Date.now();
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

  const requiredCharsPerSecond = trackChars > 0 ? trackChars / TIME_LIMIT_SECONDS : 0;

  const playerDistance = correctChars + boostCount * BOOST_BONUS_FRACTION * trackChars;
  const playerPct = trackChars > 0 ? Math.min((playerDistance / trackChars) * 100, 100) : 0;

  const opponentPcts = OPPONENTS.map((opp) => {
    const distance = requiredCharsPerSecond * opp.paceFactor * elapsedSeconds;
    const pct = trackChars > 0 ? Math.min((distance / trackChars) * 100, 100) : 0;
    return { ...opp, pct };
  });

  const standings = useMemo(() => {
    if (phase !== "done") return [];
    const racers = [{ id: "you", name: "You", emoji: "🏎️", pct: playerPct }, ...opponentPcts];
    return [...racers].sort((a, b) => b.pct - a.pct);
  }, [phase, playerPct, opponentPcts]);
  const rank = standings.findIndex((r) => r.id === "you") + 1;

  const elapsedMinutes = Math.max(elapsedSeconds / 60, 1 / 60);
  const wpm = Math.round((correctChars / 5) / elapsedMinutes) || 0;
  const accuracy = totalChars + mistakes > 0 ? Math.round((totalChars / (totalChars + mistakes)) * 100) : 100;

  const medal = rank === 1 ? "🏆" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "🏁";
  const rankMessage =
    rank === 1
      ? "You won the race!"
      : `You finished ${rank === 2 ? "2nd" : rank === 3 ? "3rd" : "4th"} — go faster to blast past them!`;

  return (
    <div className="flex flex-col gap-4 rounded-[22px] bg-white p-5 shadow-md">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[17px] font-bold text-blue-text">🏎️ Typing Grand Prix</h3>
        {phase === "playing" && (
          <span className="rounded-full bg-blue-tint px-3 py-1 font-display text-[13px] font-bold text-blue-text">
            ⏱ {timeLeft}s
          </span>
        )}
      </div>

      {phase === "ready" && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-[14.5px] font-semibold text-muted">
            Type each English word or sentence exactly as shown. Type fast and accurately to
            race your car ahead of the pack — a quick word fires a nitro boost! 🚀
          </p>
          <button
            onClick={start}
            className="rounded-2xl bg-blue px-6 py-3 font-display text-[15px] font-bold text-white shadow-md"
          >
            Start race
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="flex flex-col gap-3">
          <RaceTrack
            lanes={[
              { id: "you", name: "You", emoji: "🏎️", pct: playerPct, boosting },
              ...opponentPcts.map((o) => ({ ...o, boosting: false })),
            ]}
          />

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
            {boosting && <span className="ml-2 text-coral-text">🚀 NITRO BOOST!</span>}
          </p>
        </div>
      )}

      {phase === "done" && (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <p className="font-display text-[22px] font-extrabold text-green-text">
            {medal} {rankMessage}
          </p>
          <ol className="flex w-full flex-col gap-1.5">
            {standings.map((racer, i) => (
              <li
                key={racer.id}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-[13.5px] font-bold ${
                  racer.id === "you" ? "bg-blue-tint text-blue-text" : "bg-divider text-ink"
                }`}
              >
                <span className="w-5 font-display">{i + 1}.</span>
                <span className="text-[18px]">{racer.emoji}</span>
                <span className="flex-1">{racer.name}</span>
                <span className="text-muted">{Math.round(racer.pct)}%</span>
              </li>
            ))}
          </ol>
          <div className="flex gap-4">
            <Stat label="WPM" value={wpm} />
            <Stat label="Accuracy" value={`${accuracy}%`} />
            <Stat label="Boosts" value={boostCount} />
          </div>
          <button
            onClick={start}
            className="rounded-2xl bg-blue px-6 py-3 font-display text-[15px] font-bold text-white shadow-md"
          >
            Race again
          </button>
        </div>
      )}
    </div>
  );
}

type Lane = { id: string; name: string; emoji: string; pct: number; boosting: boolean };

function RaceTrack({ lanes }: { lanes: Lane[] }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-divider p-2.5">
      {lanes.map((lane) => (
        <div key={lane.id} className="relative h-9 overflow-hidden rounded-full bg-white">
          <div
            className="absolute inset-y-0 left-0 bg-blue-tint transition-[width] duration-150 ease-linear"
            style={{ width: `${lane.pct}%` }}
          />
          <span
            className="absolute top-1/2 -translate-y-1/2 text-[20px] leading-none transition-[left] duration-150 ease-linear"
            style={{ left: `calc(${Math.min(lane.pct, 96)}% - 2px)` }}
          >
            {lane.boosting && <span style={{ animation: "popStar 0.4s ease-out" }}>🚀</span>}
            {lane.emoji}
          </span>
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[13px]">🏁</span>
        </div>
      ))}
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
