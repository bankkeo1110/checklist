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

const TIME_LIMIT_SECONDS = 45;
// How many words to queue up at a time — refilled continuously, so the race
// always lasts the full clock instead of stopping once a fixed list runs
// out.
const BATCH_SIZE = 6;

// Fixed "track length", independent of which words this round happens to
// draw, so the whole race always measures against the same finish line.
// 150 characters at a 40 wpm pace is almost exactly the full 45s, so only a
// fast, steady typist crosses it before the clock runs out.
const TRACK_TARGET_CHARS = 150;
const REQUIRED_CHARS_PER_SECOND = TRACK_TARGET_CHARS / TIME_LIMIT_SECONDS;

// A word finished faster than this (in words-per-minute, over just that one
// word) earns a nitro boost — fast enough to reward real typing speed
// without needing a perfect run.
const BOOST_WPM = 28;
// Each boost jumps the car forward by this fraction of the track.
const BOOST_BONUS_FRACTION = 0.05;
const BOOST_VISUAL_MS = 900;
const TRACK_TICK_MS = 150;

// Opponents race the clock at a steady pace set relative to the pace needed
// to just reach the finish line in time, so the race stays close and
// genuinely winnable without being trivial.
const OPPONENTS = [
  { id: "rex", name: "Rex", emoji: "🚙", paceFactor: 0.72 },
  { id: "mia", name: "Mia", emoji: "🚓", paceFactor: 0.9 },
  { id: "zoe", name: "Zoe", emoji: "🚕", paceFactor: 1.08 },
];
const RANK_BADGE = ["#FFC93C", "#C9CDD3", "#D08A4F", "#8A8592"];

function pickBatch(): string[] {
  const shuffled = [...PROMPTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, BATCH_SIZE);
}

type Phase = "ready" | "playing" | "done";
type Lane = { id: string; name: string; emoji: string; distance: number };

export default function TypingGame() {
  const [round, setRound] = useState<string[]>(() => pickBatch());
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<Phase>("ready");
  const [correctChars, setCorrectChars] = useState(0);
  const [totalChars, setTotalChars] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [wordsTyped, setWordsTyped] = useState(0);
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

  // Countdown — the race always runs the full clock; this is the only thing
  // that ends it.
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

  // A faster tick than the countdown, so opponent cars, live positions and
  // the nitro flag all visibly update between keystrokes too.
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
    setRound(pickBatch());
    setIndex(0);
    setTyped("");
    setCorrectChars(0);
    setTotalChars(0);
    setMistakes(0);
    setWordsTyped(0);
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
      setWordsTyped((w) => w + 1);
      setTyped("");

      // Keep the queue topped up — the race never runs out of words, only
      // out of time.
      setRound((prev) => (index + 2 >= prev.length ? [...prev, ...pickBatch()] : prev));
      setIndex((i) => i + 1);
      wordStartedAt.current = Date.now();
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

  const playerDistance = correctChars + boostCount * BOOST_BONUS_FRACTION * TRACK_TARGET_CHARS;
  const lanes: Lane[] = useMemo(
    () => [
      { id: "you", name: "You", emoji: "🏎️", distance: playerDistance },
      ...OPPONENTS.map((opp) => ({
        id: opp.id,
        name: opp.name,
        emoji: opp.emoji,
        distance: REQUIRED_CHARS_PER_SECOND * opp.paceFactor * elapsedSeconds,
      })),
    ],
    [playerDistance, elapsedSeconds],
  );
  const rankById = useMemo(() => {
    const ranked = [...lanes].sort((a, b) => b.distance - a.distance);
    const map = new Map<string, number>();
    ranked.forEach((lane, i) => map.set(lane.id, i + 1));
    return map;
  }, [lanes]);
  const rank = rankById.get("you") ?? lanes.length;

  const elapsedMinutes = Math.max(elapsedSeconds / 60, 1 / 60);
  const wpm = Math.round((correctChars / 5) / elapsedMinutes) || 0;
  const accuracy = totalChars + mistakes > 0 ? Math.round((totalChars / (totalChars + mistakes)) * 100) : 100;
  const speedKmh = Math.round(wpm * 6);

  const medal = rank === 1 ? "🏆" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "🏁";
  const rankMessage =
    rank === 1
      ? "You won the race!"
      : `You finished ${rank === 2 ? "2nd" : rank === 3 ? "3rd" : "4th"} — go faster to blast past them!`;

  return (
    <div
      className="flex flex-col gap-4 rounded-[22px] p-5 shadow-lg"
      style={{ background: "linear-gradient(165deg,#ffffff,#f4f1ff)" }}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[18px] font-extrabold tracking-tight">
          <span style={{ background: "linear-gradient(90deg,#4D96FF,#B983FF)", WebkitBackgroundClip: "text", color: "transparent" }}>
            🏁 Typing Grand Prix
          </span>
        </h3>
        {phase === "playing" && <CountdownRing timeLeft={timeLeft} />}
      </div>

      {phase === "ready" && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-[14.5px] font-semibold text-muted">
            Type each English word or sentence exactly as shown. The race runs the full clock —
            type fast and accurately to stay ahead, and a quick word fires a nitro boost! 🚀
          </p>
          <button
            onClick={start}
            className="rounded-2xl px-6 py-3 font-display text-[15px] font-bold text-white shadow-md"
            style={{ background: "linear-gradient(135deg,#4D96FF,#B983FF)" }}
          >
            Start race 🏎️
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="flex flex-col gap-3">
          <RaceTrack
            lanes={lanes.map((lane) => ({ ...lane, boosting: lane.id === "you" && boosting }))}
            rankById={rankById}
          />
          <p className="text-center text-[11.5px] font-bold uppercase tracking-wide text-muted">
            ⚡ {speedKmh} km/h · You&apos;re in {ordinal(rank)} place
          </p>

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
            Words typed: {wordsTyped}
            {boosting && <span className="ml-2 text-coral-text">🚀 NITRO BOOST!</span>}
          </p>
        </div>
      )}

      {phase === "done" && (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <p className="font-display text-[22px] font-extrabold text-green-text">
            {medal} {rankMessage}
          </p>
          <div className="w-full">
            <p className="mb-1.5 text-left text-[11px] font-bold uppercase tracking-wide text-muted">
              Final positions
            </p>
            <ol className="flex w-full flex-col gap-1.5">
              {[...lanes]
                .sort((a, b) => b.distance - a.distance)
                .map((racer, i) => (
                  <li
                    key={racer.id}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-[13.5px] font-bold ${
                      racer.id === "you" ? "bg-blue-tint text-blue-text" : "bg-divider text-ink"
                    }`}
                  >
                    <span
                      className="flex h-5 w-5 flex-none items-center justify-center rounded-full text-[10.5px] font-extrabold text-white"
                      style={{ background: RANK_BADGE[i] ?? "#8A8592" }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-[18px]">{racer.emoji}</span>
                    <span className="flex-1">{racer.name}</span>
                    <span className="text-muted">{Math.round(Math.min((racer.distance / TRACK_TARGET_CHARS) * 100, 100))}%</span>
                  </li>
                ))}
            </ol>
          </div>
          <div className="flex gap-4">
            <Stat label="WPM" value={wpm} />
            <Stat label="Accuracy" value={`${accuracy}%`} />
            <Stat label="Boosts" value={boostCount} />
          </div>
          <button
            onClick={start}
            className="rounded-2xl px-6 py-3 font-display text-[15px] font-bold text-white shadow-md"
            style={{ background: "linear-gradient(135deg,#4D96FF,#B983FF)" }}
          >
            Race again 🏁
          </button>
        </div>
      )}
    </div>
  );
}

function ordinal(n: number): string {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

function CountdownRing({ timeLeft }: { timeLeft: number }) {
  const fraction = timeLeft / TIME_LIMIT_SECONDS;
  return (
    <div className="relative h-11 w-11 flex-none">
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: `conic-gradient(#4D96FF ${fraction * 360}deg, #e8f3ff 0deg)` }}
      />
      <div className="absolute inset-[3px] flex items-center justify-center rounded-full bg-white font-display text-[13px] font-extrabold text-blue-text">
        {timeLeft}
      </div>
    </div>
  );
}

type RaceLane = Lane & { boosting: boolean };

function RaceTrack({ lanes, rankById }: { lanes: RaceLane[]; rankById: Map<string, number> }) {
  return (
    <div
      className="flex flex-col gap-1.5 rounded-2xl p-2.5 shadow-inner"
      style={{ background: "linear-gradient(180deg,#2b2b38,#17171f)" }}
    >
      {lanes.map((lane) => {
        const pct = Math.min((lane.distance / TRACK_TARGET_CHARS) * 100, 100);
        const rank = rankById.get(lane.id) ?? lanes.length;
        return (
          <div
            key={lane.id}
            className="relative h-11 overflow-hidden rounded-xl"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, #35353f 0 18px, #2d2d36 18px 36px), repeating-linear-gradient(90deg, rgba(255,255,255,.45) 0 9px, transparent 9px 22px)",
              backgroundSize: "100% 100%, 100% 2px",
              backgroundPosition: "0 0, 0 50%",
              backgroundRepeat: "repeat, repeat-x",
            }}
          >
            <div
              className="absolute inset-y-0 left-0 transition-[width] duration-150 ease-linear"
              style={{
                width: `${pct}%`,
                background:
                  lane.id === "you"
                    ? "linear-gradient(90deg, rgba(77,150,255,0), rgba(77,150,255,.4))"
                    : "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.14))",
              }}
            />
            <span
              className="absolute left-1.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-[10.5px] font-extrabold text-white shadow"
              style={{ background: RANK_BADGE[rank - 1] ?? "#8A8592" }}
            >
              {rank}
            </span>
            <span
              className="absolute top-1/2 flex items-center text-[25px] leading-none transition-[left] duration-150 ease-linear"
              style={{
                left: `max(26px, calc(${Math.min(pct, 94)}% - 2px))`,
                transform: `translateY(-50%) ${lane.boosting ? "scale(1.18) rotate(-6deg)" : "rotate(0deg)"}`,
                filter: "drop-shadow(0 3px 3px rgba(0,0,0,.45))",
              }}
            >
              {lane.boosting && (
                <span className="mr-0.5 text-[18px]" style={{ animation: "popStar 0.4s ease-out" }}>
                  🔥
                </span>
              )}
              {lane.emoji}
            </span>
            <div
              className="absolute right-0 top-0 h-full w-2.5"
              style={{
                backgroundImage:
                  "repeating-conic-gradient(#fff 0deg 90deg, #111 90deg 180deg)",
                backgroundSize: "6px 6px",
              }}
            />
          </div>
        );
      })}
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
