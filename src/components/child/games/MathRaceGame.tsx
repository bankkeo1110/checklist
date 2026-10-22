"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

// --- Race tuning -----------------------------------------------------------
// The race always drives for this many seconds in total, split into pit
// stops every DRIVE_SEGMENT_SECONDS — the clock only ticks while actually
// driving, so pausing for a question never costs the player track time.
const TOTAL_DRIVE_SECONDS = 60;
const DRIVE_SEGMENT_SECONDS = 10;
const CHECKPOINTS = [10, 20, 30, 40, 50]; // last 10s stretch runs straight to the finish
const TRACK_TARGET_UNITS = 300;
const REQUIRED_UNITS_PER_SECOND = TRACK_TARGET_UNITS / TOTAL_DRIVE_SECONDS;
const BOOST_BONUS_FRACTION = 0.08;
const WRONG_PENALTY_FRACTION = 0.03;
const BOOST_VISUAL_MS = 1100;
const DRIVE_TICK_MS = 120;
const FEEDBACK_PAUSE_MS = 1300;

const OPPONENTS = [
  { id: "rex", name: "Rex", emoji: "🚙", paceFactor: 0.72 },
  { id: "mia", name: "Mia", emoji: "🚓", paceFactor: 0.9 },
  { id: "zoe", name: "Zoe", emoji: "🚕", paceFactor: 1.08 },
];
const RANK_BADGE = ["#FFC93C", "#C9CDD3", "#D08A4F", "#8A8592"];

// --- Question generation ----------------------------------------------------
// Four question kinds, mixed randomly: fraction add/subtract, fraction
// compare, decimal add/subtract, decimal compare — the set the user asked
// for (phân số & số thập phân: cộng trừ, so sánh).

type MathQuestion = { prompt: string; answer: string; choices: string[] };

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function fracStr(num: number, den: number): string {
  return `${num}/${den}`;
}

function simplify(num: number, den: number): [number, number] {
  const g = gcd(Math.abs(num), den) || 1;
  return [num / g, den / g];
}

const FRACTION_DENOMS = [2, 3, 4, 5, 6, 8, 10, 12];

function shuffledChoices(correct: string, pool: string[]): string[] {
  const choices = new Set<string>([correct]);
  for (const candidate of pool) {
    if (choices.size >= 4) break;
    if (candidate !== correct) choices.add(candidate);
  }
  return Array.from(choices).sort(() => Math.random() - 0.5);
}

function makeFractionAddSub(): MathQuestion {
  const den = FRACTION_DENOMS[Math.floor(Math.random() * FRACTION_DENOMS.length)];
  const op = Math.random() < 0.5 ? "+" : "-";
  let num1 = 1 + Math.floor(Math.random() * (den - 1));
  let num2 = 1 + Math.floor(Math.random() * (den - 1));
  if (op === "+") {
    // Keep the sum a proper fraction (<= den) so there's no mixed number.
    num2 = 1 + Math.floor(Math.random() * Math.max(1, den - num1));
  } else if (num1 < num2) {
    [num1, num2] = [num2, num1];
  }
  const rawResult = op === "+" ? num1 + num2 : num1 - num2;
  const [sNum, sDen] = simplify(rawResult, den);
  const answer = fracStr(sNum, sDen);

  const distractorPool = [
    fracStr(rawResult, den), // unsimplified, if different from the reduced answer
    fracStr(Math.max(0, rawResult - 1), den),
    fracStr(rawResult + 1, den),
    fracStr(sNum, Math.max(2, sDen - 1)),
    fracStr(op === "+" ? Math.abs(num1 - num2) : num1 + num2, den), // the "other" operation's result
  ];
  return {
    prompt: `${fracStr(num1, den)} ${op} ${fracStr(num2, den)} = ?`,
    answer,
    choices: shuffledChoices(answer, distractorPool),
  };
}

function makeFractionCompare(): MathQuestion {
  let n1 = 1 + Math.floor(Math.random() * 7);
  const d1 = FRACTION_DENOMS[Math.floor(Math.random() * FRACTION_DENOMS.length)];
  if (n1 > d1) n1 = d1 - 1 || 1;

  // Retry on equal values (cross-multiplication tie) so there's always a
  // single bigger fraction to pick. Re-rolls BOTH n2 and d2 together —
  // re-rolling only the numerator can trap this forever when d1/d2 both
  // reduce to the same value with just one possible numerator (e.g. 1/2
  // vs 1/2, where denominator 2 only ever has numerator 1). A bounded
  // guard keeps this from ever looping forever even so.
  let n2 = 1;
  let d2 = d1;
  let guard = 0;
  do {
    d2 = FRACTION_DENOMS[Math.floor(Math.random() * FRACTION_DENOMS.length)];
    n2 = 1 + Math.floor(Math.random() * (d2 - 1));
    guard++;
  } while (n1 * d2 === n2 * d1 && guard < 20);

  const fracA = fracStr(n1, d1);
  const fracB = fracStr(n2, d2);
  const answer = n1 * d2 > n2 * d1 ? fracA : fracB;
  const decoyDen = FRACTION_DENOMS[Math.floor(Math.random() * FRACTION_DENOMS.length)];
  const decoyPool = [
    fracA,
    fracB,
    fracStr(1 + Math.floor(Math.random() * (decoyDen - 1)), decoyDen),
    fracStr(1 + Math.floor(Math.random() * (decoyDen - 1)), decoyDen),
  ];
  return {
    prompt: `Which is greater: ${fracA} or ${fracB}?`,
    answer,
    choices: shuffledChoices(answer, decoyPool),
  };
}

// Decimals are generated and combined in integer "cents" at a fixed scale
// (10 for 1 decimal place, 100 for 2) so there's never a floating-point
// rounding surprise in the result.
function centsToStr(cents: number, scale: number): string {
  const digits = String(scale - 1).length;
  const whole = Math.floor(cents / scale);
  const frac = cents % scale;
  return `${whole}.${String(frac).padStart(digits, "0")}`;
}

function randomCents(scale: number): number {
  const whole = Math.floor(Math.random() * 3); // 0, 1 or 2 whole units
  const frac = 1 + Math.floor(Math.random() * (scale - 1)); // never a whole ".0"
  return whole * scale + frac;
}

function makeDecimalAddSub(): MathQuestion {
  const scale = Math.random() < 0.5 ? 10 : 100;
  const op = Math.random() < 0.5 ? "+" : "-";
  let a = randomCents(scale);
  let b = randomCents(scale);
  if (op === "-" && a < b) [a, b] = [b, a];
  const result = op === "+" ? a + b : a - b;
  const answer = centsToStr(result, scale);
  const distractorPool = [
    centsToStr(Math.max(0, result - scale / 10 || result - 1), scale),
    centsToStr(result + (scale / 10 || 1), scale),
    centsToStr(op === "+" ? Math.abs(a - b) : a + b, scale),
    centsToStr(Math.max(0, result - 1), scale),
  ];
  return {
    prompt: `${centsToStr(a, scale)} ${op} ${centsToStr(b, scale)} = ?`,
    answer,
    choices: shuffledChoices(answer, distractorPool),
  };
}

function makeDecimalCompare(): MathQuestion {
  const scale = Math.random() < 0.5 ? 10 : 100;
  const a = randomCents(scale);
  let b = randomCents(scale);
  while (a === b) b = randomCents(scale);
  const strA = centsToStr(a, scale);
  const strB = centsToStr(b, scale);
  const answer = a > b ? strA : strB;
  const decoyScale = Math.random() < 0.5 ? 10 : 100;
  const decoyPool = [strA, strB, centsToStr(randomCents(decoyScale), decoyScale), centsToStr(randomCents(decoyScale), decoyScale)];
  return {
    prompt: `Which is greater: ${strA} or ${strB}?`,
    answer,
    choices: shuffledChoices(answer, decoyPool),
  };
}

const QUESTION_MAKERS = [makeFractionAddSub, makeFractionCompare, makeDecimalAddSub, makeDecimalCompare];

function makeMathQuestion(): MathQuestion {
  const maker = QUESTION_MAKERS[Math.floor(Math.random() * QUESTION_MAKERS.length)];
  return maker();
}

// --- Game ---------------------------------------------------------------

type Phase = "ready" | "driving" | "question" | "done";
type Lane = { id: string; name: string; emoji: string; distance: number };

type Spark = { style: CSSProperties };
const SPARK_COLORS = ["#6BCB77", "#4D96FF", "#FFC93C", "#B983FF", "#FF9F45"];
function makeSparks(): Spark[] {
  return Array.from({ length: 10 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 26 + Math.random() * 38;
    const color = SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)];
    return {
      style: {
        "--dx": `${(Math.cos(angle) * dist).toFixed(1)}px`,
        "--dy": `${(Math.sin(angle) * dist - 14).toFixed(1)}px`,
        "--rot": `${Math.round(Math.random() * 360)}deg`,
        animationDelay: `${Math.round(Math.random() * 80)}ms`,
        background: color,
      } as CSSProperties,
    };
  });
}

export default function MathRaceGame() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [driveRun, setDriveRun] = useState(0);
  const [drivingElapsed, setDrivingElapsed] = useState(0);
  const [boosting, setBoosting] = useState(false);
  const [boostTotal, setBoostTotal] = useState(0);
  const [question, setQuestion] = useState<MathQuestion | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [sparks, setSparks] = useState<Spark[]>([]);

  const resumedAtRef = useRef(0);
  const pausedElapsedRef = useRef(0);
  const checkpointIndexRef = useRef(0);
  // Ticks remaining on the nitro-boost visual flag, counted down by the
  // driving interval — a tick counter rather than a Date.now() deadline, so
  // triggering it from the answer handler (reached through the choices
  // list's onClick) never calls an impure function from render's reach.
  const boostTicksRef = useRef(0);

  // Drives the race clock. Only runs while phase === "driving"; a pit stop
  // (phase === "question") simply lets this effect unmount and freezes
  // drivingElapsed until a new driveRun resumes it.
  useEffect(() => {
    if (phase !== "driving") return;
    resumedAtRef.current = Date.now();
    const id = setInterval(() => {
      const delta = (Date.now() - resumedAtRef.current) / 1000;
      const elapsed = Math.min(pausedElapsedRef.current + delta, TOTAL_DRIVE_SECONDS);
      setDrivingElapsed(elapsed);
      if (boostTicksRef.current > 0) boostTicksRef.current -= 1;
      setBoosting(boostTicksRef.current > 0);

      if (elapsed >= TOTAL_DRIVE_SECONDS) {
        clearInterval(id);
        pausedElapsedRef.current = TOTAL_DRIVE_SECONDS;
        setPhase("done");
        return;
      }
      const nextCheckpoint = CHECKPOINTS[checkpointIndexRef.current];
      if (nextCheckpoint !== undefined && elapsed >= nextCheckpoint) {
        clearInterval(id);
        pausedElapsedRef.current = nextCheckpoint;
        checkpointIndexRef.current += 1;
        setDrivingElapsed(nextCheckpoint);
        setQuestion(makeMathQuestion());
        setPicked(null);
        setResult(null);
        setPhase("question");
      }
    }, DRIVE_TICK_MS);
    return () => clearInterval(id);
  }, [phase, driveRun]);

  function start() {
    pausedElapsedRef.current = 0;
    checkpointIndexRef.current = 0;
    boostTicksRef.current = 0;
    setDrivingElapsed(0);
    setBoosting(false);
    setBoostTotal(0);
    setQuestion(null);
    setPicked(null);
    setResult(null);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setWrongCount(0);
    setSparks([]);
    setPhase("driving");
    setDriveRun((n) => n + 1);
  }

  function handleChoose(choice: string) {
    if (!question || result) return;
    const isCorrect = choice === question.answer;
    setPicked(choice);
    setResult(isCorrect ? "correct" : "wrong");

    if (isCorrect) {
      setBoostTotal((b) => b + BOOST_BONUS_FRACTION * TRACK_TARGET_UNITS);
      setCorrectCount((c) => c + 1);
      setScore((s) => s + (streak >= 2 ? 15 : 10));
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setBestStreak((best) => Math.max(best, nextStreak));
      setSparks(makeSparks());
      boostTicksRef.current = Math.ceil(BOOST_VISUAL_MS / DRIVE_TICK_MS);
    } else {
      setBoostTotal((b) => b - WRONG_PENALTY_FRACTION * TRACK_TARGET_UNITS);
      setStreak(0);
      setWrongCount((c) => c + 1);
    }

    setTimeout(() => {
      setPhase("driving");
      setDriveRun((n) => n + 1);
    }, FEEDBACK_PAUSE_MS);
  }

  const playerDistance = Math.max(0, REQUIRED_UNITS_PER_SECOND * drivingElapsed + boostTotal);
  const lanes: Lane[] = useMemo(
    () => [
      { id: "you", name: "You", emoji: "🏎️", distance: playerDistance },
      ...OPPONENTS.map((opp) => ({
        id: opp.id,
        name: opp.name,
        emoji: opp.emoji,
        distance: REQUIRED_UNITS_PER_SECOND * opp.paceFactor * drivingElapsed,
      })),
    ],
    [playerDistance, drivingElapsed],
  );
  const rankById = useMemo(() => {
    const ranked = [...lanes].sort((a, b) => b.distance - a.distance);
    const map = new Map<string, number>();
    ranked.forEach((lane, i) => map.set(lane.id, i + 1));
    return map;
  }, [lanes]);
  const rank = rankById.get("you") ?? lanes.length;

  const medal = rank === 1 ? "🏆" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "🏁";
  const rankMessage =
    rank === 1
      ? "You won the race!"
      : `You finished ${ordinal(rank)} — sharpen those answers to blast past them!`;
  // Derived purely from drivingElapsed (never the ref) so this stays safe to
  // read during render: the next checkpoint is always the next multiple of
  // DRIVE_SEGMENT_SECONDS, capped at the finish.
  const nextCheckpointAt = Math.min(
    TOTAL_DRIVE_SECONDS,
    (Math.floor(drivingElapsed / DRIVE_SEGMENT_SECONDS) + 1) * DRIVE_SEGMENT_SECONDS,
  );
  const secondsToNext = phase === "driving" ? Math.max(0, nextCheckpointAt - drivingElapsed) : 0;

  return (
    <div className="flex flex-col gap-4 rounded-[22px] p-5 shadow-lg" style={{ background: "linear-gradient(165deg,#ffffff,#f3eaff)" }}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[18px] font-extrabold tracking-tight">
          <span style={{ background: "linear-gradient(90deg,#B983FF,#4D96FF)", WebkitBackgroundClip: "text", color: "transparent" }}>
            🏁 Math Grand Prix
          </span>
        </h3>
        {(phase === "driving" || phase === "question") && (
          <span className="rounded-full bg-purple-tint px-3 py-1 font-display text-[13px] font-bold text-purple-text">
            ⭐ {score}
          </span>
        )}
      </div>

      {phase === "ready" && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-[14.5px] font-semibold text-muted">
            Drive for 10 seconds, then pit-stop for a fractions or decimals question — add, subtract
            or compare. Answer right for a nitro boost; the race always runs the full 60s! 🚀
          </p>
          <button
            onClick={start}
            className="rounded-2xl px-6 py-3 font-display text-[15px] font-bold text-white shadow-md"
            style={{ background: "linear-gradient(135deg,#B983FF,#4D96FF)" }}
          >
            Start race 🏎️
          </button>
        </div>
      )}

      {(phase === "driving" || phase === "question") && (
        <div className="flex flex-col gap-3">
          <RaceTrack lanes={lanes.map((lane) => ({ ...lane, boosting: lane.id === "you" && boosting }))} rankById={rankById} />
          <p className="text-center text-[11.5px] font-bold uppercase tracking-wide text-muted">
            🏁 {Math.round(drivingElapsed)}s / {TOTAL_DRIVE_SECONDS}s · You&apos;re in {ordinal(rank)} place
            {phase === "driving" && ` · next pit stop in ${Math.ceil(secondsToNext)}s`}
          </p>

          {phase === "driving" && (
            <div className="flex flex-col items-center gap-2 rounded-2xl bg-purple-tint px-4 py-6 text-center">
              <span className="text-[26px]">🏎️💨</span>
              <p className="font-display text-[14px] font-bold text-purple-text">Racing! Get ready for the next pit stop…</p>
            </div>
          )}

          {phase === "question" && question && (
            <div className="flex flex-col gap-3">
              <div
                className={`relative flex flex-col items-center justify-center gap-1 rounded-2xl bg-divider px-4 py-5 text-center ${
                  result === "wrong" ? "animate-[shake_0.4s_ease-in-out]" : ""
                }`}
              >
                <span className="font-display text-[11px] font-bold uppercase tracking-wide text-muted">🛑 Pit stop!</span>
                <p className="font-display text-[20px] font-extrabold">{question.prompt}</p>
                {result === "correct" && (
                  <span className="font-display text-[11.5px] font-bold text-orange">🚀 Nitro boost!</span>
                )}
                {sparks.map((p, i) => (
                  <span
                    key={i}
                    style={p.style}
                    className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-sm animate-[confetti-fly_0.8s_ease-out_forwards]"
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {question.choices.map((choice) => {
                  const isPicked = picked === choice;
                  let style = "bg-divider text-ink";
                  if (result && isPicked) {
                    style = result === "correct" ? "bg-green text-white" : "bg-coral text-white";
                  } else if (result && choice === question.answer) {
                    style = "bg-green-tint text-green-text";
                  }
                  return (
                    <button
                      key={choice}
                      onClick={() => handleChoose(choice)}
                      disabled={!!result}
                      className={`rounded-2xl px-4 py-3 font-display text-[16px] font-bold transition-colors ${style}`}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <p className="text-center text-[12px] font-bold uppercase tracking-wide text-muted">
            ✅ {correctCount} · ❌ {wrongCount} {streak >= 2 ? `🔥 x${streak} combo!` : ""}
          </p>
        </div>
      )}

      {phase === "done" && (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <p className="font-display text-[22px] font-extrabold text-purple-text">
            {medal} {rankMessage}
          </p>
          <div className="w-full">
            <p className="mb-1.5 text-left text-[11px] font-bold uppercase tracking-wide text-muted">Final positions</p>
            <ol className="flex w-full flex-col gap-1.5">
              {[...lanes]
                .sort((a, b) => b.distance - a.distance)
                .map((racer, i) => (
                  <li
                    key={racer.id}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-[13.5px] font-bold ${
                      racer.id === "you" ? "bg-purple-tint text-purple-text" : "bg-divider text-ink"
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
                    <span className="text-muted">{Math.round(Math.min((racer.distance / TRACK_TARGET_UNITS) * 100, 100))}%</span>
                  </li>
                ))}
            </ol>
          </div>
          <div className="flex gap-4">
            <Stat label="Score" value={score} />
            <Stat label="Correct" value={correctCount} />
            <Stat label="Best combo" value={`🔥${bestStreak}`} />
          </div>
          <button
            onClick={start}
            className="rounded-2xl px-6 py-3 font-display text-[15px] font-bold text-white shadow-md"
            style={{ background: "linear-gradient(135deg,#B983FF,#4D96FF)" }}
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

type RaceLane = Lane & { boosting: boolean };

function RaceTrack({ lanes, rankById }: { lanes: RaceLane[]; rankById: Map<string, number> }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl p-2.5 shadow-inner" style={{ background: "linear-gradient(180deg,#2b2b38,#17171f)" }}>
      {lanes.map((lane) => {
        const pct = Math.min((lane.distance / TRACK_TARGET_UNITS) * 100, 100);
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
                    ? "linear-gradient(90deg, rgba(185,131,255,0), rgba(185,131,255,.4))"
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
              style={{ backgroundImage: "repeating-conic-gradient(#fff 0deg 90deg, #111 90deg 180deg)", backgroundSize: "6px 6px" }}
            />
          </div>
        );
      })}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-divider px-4 py-2">
      <span className="font-display text-[20px] font-extrabold text-purple-text">{value}</span>
      <span className="text-[11px] font-bold uppercase tracking-wide text-muted">{label}</span>
    </div>
  );
}
