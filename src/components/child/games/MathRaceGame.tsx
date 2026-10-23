"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

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

// --- Terrain -----------------------------------------------------------
// A deterministic (seeded) sum of sine waves — rolling hills with the odd
// bigger bump, never jagged or impossible. Pure functions of (x, seed), so
// they're safe to call directly from render as many times as needed.

function terrainHeight(x: number, seed: number): number {
  return (
    42 * Math.sin(x * 0.0055 + seed) +
    16 * Math.sin(x * 0.017 + seed * 1.6) +
    7 * Math.sin(x * 0.045 + seed * 2.4)
  );
}

function terrainSlope(x: number, seed: number): number {
  const d = 2;
  return (terrainHeight(x + d, seed) - terrainHeight(x - d, seed)) / (2 * d);
}

// --- Hill-climb physics tuning ------------------------------------------

const VIEW_WIDTH = 720;
const VIEW_HEIGHT = 380;
const BASELINE_Y = 248;
const CAR_SCREEN_X = VIEW_WIDTH * 0.3;
const TICK_MS = 50;
const TERRAIN_STEP = 12;

const MAX_SPEED = 150; // world units / second
const MIN_SPEED = -40; // a little reverse, to back off a wall
const ACCEL = 85;
const BRAKE_DECEL = 110;
const COAST_FRICTION = 30;
const SLOPE_ACCEL_FACTOR = 220; // how hard hills push back/forward
const TILT_DEG_PER_SLOPE = 60;
const MAX_TILT_DEG = 28;

const FUEL_MAX = 100;
const FUEL_DRAIN_PER_SEC = 2.4;
const PITSTOP_FUEL_BONUS = 35;
const PITSTOP_SPEED_KICK = 25;
const BOOST_VISUAL_MS = 1200;
const STOPPED_TICKS_TO_END = 20; // ~1s of being essentially stationary

const FINISH_DISTANCE = 5000;

// --- Car garage -----------------------------------------------------------
// 10 picks, smallest/cutest first — each step up is bigger on screen (scale)
// and reads fiercer (a bolder emoji + a hotter glow color), so "bigger = more
// badass" is true both in size and in look.

type CarType = {
  id: string;
  emoji: string;
  name: string;
  scale: number;
  glow: string;
  body: string;
  accent: string;
};

const CAR_TYPES: CarType[] = [
  { id: "sedan", emoji: "🚗", name: "Sedan", scale: 0.8, glow: "rgba(0,0,0,.25)", body: "#B9C0C9", accent: "#7C8594" },
  { id: "taxi", emoji: "🚕", name: "Taxi", scale: 0.88, glow: "rgba(0,0,0,.28)", body: "#FFD23F", accent: "#1A1A1A" },
  { id: "suv", emoji: "🚙", name: "SUV", scale: 0.96, glow: "rgba(0,0,0,.3)", body: "#4A5B73", accent: "#2E3A4D" },
  { id: "van", emoji: "🚐", name: "Minivan", scale: 1.04, glow: "rgba(0,0,0,.32)", body: "#6FB3A8", accent: "#3F8A7F" },
  { id: "police", emoji: "🚓", name: "Police", scale: 1.1, glow: "rgba(77,150,255,.45)", body: "#F4F6F8", accent: "#2B6CB0" },
  { id: "ambulance", emoji: "🚑", name: "Ambulance", scale: 1.16, glow: "rgba(255,107,107,.45)", body: "#FDFDFD", accent: "#E63946" },
  { id: "racer", emoji: "🏎️", name: "Race car", scale: 1.24, glow: "rgba(255,201,60,.5)", body: "#E63946", accent: "#FFC93C" },
  { id: "pickup", emoji: "🛻", name: "Pickup", scale: 1.32, glow: "rgba(255,159,69,.5)", body: "#FF9F45", accent: "#7A4A24" },
  { id: "truck", emoji: "🚚", name: "Big truck", scale: 1.42, glow: "rgba(255,107,107,.55)", body: "#D64545", accent: "#33373D" },
  { id: "monster", emoji: "🚜", name: "Monster rig", scale: 1.55, glow: "rgba(255,69,58,.65)", body: "#22252B", accent: "#FF4538" },
];

// A hand-drawn SVG side profile, nose on the RIGHT — not a system emoji.
// Emoji car glyphs vary by platform: most vendors draw them facing left, but
// Microsoft's set faces right, and vertical placement inside the glyph box
// varies too. That ambiguity is exactly what made the car look like it was
// driving backwards on some devices and sitting half-buried in the ground
// on others (the old "-60%" vertical offset was tuned against one font's
// metrics and wrong on others). A shape this component draws itself renders
// identically everywhere, so direction and the ground anchor are fixed, not
// guessed. The bottom edge of the viewBox is exactly the tires' contact
// line — callers anchor to that edge, not to a glyph's invisible baseline.
// Lightens (amt > 0) or darkens (amt < 0) a #rrggbb/#rgb color toward white
// or black by amt (0..1) — used to build a glossy top-to-bottom gradient out
// of each car's single base color instead of hand-picking two more shades
// per car type.
function shade(hex: string, amt: number): string {
  const c = hex.replace("#", "");
  const full = c.length === 3 ? c.split("").map((ch) => ch + ch).join("") : c;
  const num = parseInt(full, 16);
  const target = amt >= 0 ? 255 : 0;
  const t = Math.min(1, Math.abs(amt));
  const mix = (channel: number) => Math.round(channel + (target - channel) * t);
  const r = mix((num >> 16) & 255);
  const g = mix((num >> 8) & 255);
  const b = mix(num & 255);
  return `rgb(${r},${g},${b})`;
}

function CarSprite({ car }: { car: CarType }) {
  const showLightbar = car.id === "police";
  const showCross = car.id === "ambulance";
  const big = car.id === "monster" || car.id === "truck" || car.id === "pickup";
  const wheelR = big ? 9 : 7.5;
  const gradId = `carGrad-${car.id}`;
  return (
    <svg viewBox="0 0 112 43" width={92} height={38} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={shade(car.body, 0.4)} />
          <stop offset="50%" stopColor={car.body} />
          <stop offset="100%" stopColor={shade(car.body, -0.25)} />
        </linearGradient>
      </defs>

      {/* Rounded, nose-right silhouette — see CarSprite's module comment
          above for why this is drawn rather than borrowed from a glyph. */}
      <path
        d="M8,34 Q8,23 17,19 L21,15 Q27,9 39,9 L69,9 Q79,9 85,14 L95,21 Q105,23 105,30 L105,34 Z"
        fill={`url(#${gradId})`}
        stroke={shade(car.body, -0.4)}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />

      <path d="M24,16 L30,10.5 L66,10.5 L80,17 Z" fill="#CFE9FB" opacity={0.92} />
      <rect x={9} y={25} width={94} height={3.6} fill={car.accent} opacity={0.9} rx={1} />

      {showLightbar && (
        <>
          <rect x={38} y={4.5} width={11} height={5} rx={1.6} fill="#2B6CB0" />
          <rect x={49} y={4.5} width={11} height={5} rx={1.6} fill="#E63946" />
        </>
      )}
      {showCross && (
        <g fill="#E63946">
          <rect x={46} y={13} width={11} height={3.2} />
          <rect x={50} y={9} width={3.2} height={11} />
        </g>
      )}

      <circle cx={105} cy={25} r={2.8} fill="#FFF6B0" />
      <circle cx={8} cy={25} r={2.4} fill="#FF4545" />

      <circle cx={30} cy={34} r={wheelR} fill="#1B1E24" />
      <circle cx={30} cy={34} r={wheelR * 0.55} fill="#8A9099" />
      <circle cx={30 - wheelR * 0.3} cy={34 - wheelR * 0.3} r={wheelR * 0.18} fill="#fff" opacity={0.6} />
      <circle cx={84} cy={34} r={wheelR} fill="#1B1E24" />
      <circle cx={84} cy={34} r={wheelR * 0.55} fill="#8A9099" />
      <circle cx={84 - wheelR * 0.3} cy={34 - wheelR * 0.3} r={wheelR * 0.18} fill="#fff" opacity={0.6} />
    </svg>
  );
}

// --- Sky decoration -------------------------------------------------------
// A fixed, deterministic field of clouds (no Math.random at module scope —
// that would compute once on the server and again on the client, producing
// two different sets and a hydration mismatch). Each cloud scrolls at a
// fraction of the camera speed (parallax) so the sky reads as far away.

type Cloud = { worldX: number; y: number; scale: number };
const CLOUD_PARALLAX = 0.3;
const CLOUDS: Cloud[] = Array.from({ length: 24 }, (_, i) => ({
  worldX: -200 + i * 240,
  y: 18 + 16 * Math.abs(Math.sin(i * 1.7)),
  scale: 0.6 + 0.4 * Math.abs(Math.sin(i * 0.9 + 1)),
}));

function Puff({ cx, cy, scale }: { cx: number; cy: number; scale: number }) {
  return (
    <g opacity={0.85}>
      <ellipse cx={cx} cy={cy} rx={22 * scale} ry={11 * scale} fill="#fff" />
      <ellipse cx={cx - 14 * scale} cy={cy + 4 * scale} rx={14 * scale} ry={9 * scale} fill="#fff" />
      <ellipse cx={cx + 15 * scale} cy={cy + 3 * scale} rx={15 * scale} ry={9 * scale} fill="#fff" />
    </g>
  );
}

// --- Collectibles --------------------------------------------------------

type ItemKind = "coin" | "pitstop";
type Item = { id: number; worldX: number; kind: ItemKind; collected: boolean };
const COLLECT_RADIUS = 14;

function generateItems(): Item[] {
  let id = 0;
  const coins: Item[] = [];
  let x = 150;
  while (x < FINISH_DISTANCE - 100) {
    coins.push({ id: id++, worldX: Math.round(x), kind: "coin", collected: false });
    x += 110 + Math.random() * 90;
  }
  const pitstops: Item[] = [];
  x = 500;
  while (x < FINISH_DISTANCE - 200) {
    pitstops.push({ id: id++, worldX: Math.round(x), kind: "pitstop", collected: false });
    x += 480 + Math.random() * 220;
  }
  return [...coins, ...pitstops].sort((a, b) => a.worldX - b.worldX);
}

// --- Sparks (correct-answer flourish, same pattern as the other games) ---

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

// --- Game ---------------------------------------------------------------

type Phase = "ready" | "driving" | "question" | "done";
type Outcome = "finished" | "stranded" | null;

const CAR_STORAGE_KEY = "mathrace.carId";

export default function MathRaceGame() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [carId, setCarId] = useState<string>(CAR_TYPES[0].id);
  const [driveRun, setDriveRun] = useState(0);
  const [seed, setSeed] = useState(0);
  const [carX, setCarX] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [fuel, setFuel] = useState(FUEL_MAX);
  const [score, setScore] = useState(0);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [pitstopsAnswered, setPitstopsAnswered] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [gasPressed, setGasPressed] = useState(false);
  const [brakePressed, setBrakePressed] = useState(false);
  const [boosting, setBoosting] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [question, setQuestion] = useState<MathQuestion | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [sparks, setSparks] = useState<Spark[]>([]);

  // Remembered pick, read once after mount — localStorage doesn't exist on
  // the server, so this can't run during the initial render; syncing it in
  // right after is the standard escape hatch for that (hence the lint
  // suppression — this isn't the "derived from props/state" case the rule
  // guards against).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CAR_STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- loading a per-device pick from localStorage, not state derived from props/state
      if (saved && CAR_TYPES.some((c) => c.id === saved)) setCarId(saved);
    } catch {
      // ignore — storage may be blocked
    }
  }, []);

  function chooseCar(id: string) {
    setCarId(id);
    try {
      localStorage.setItem(CAR_STORAGE_KEY, id);
    } catch {
      // ignore — storage may be blocked
    }
  }

  const carXRef = useRef(0);
  const speedRef = useRef(0);
  const fuelRef = useRef(FUEL_MAX);
  const throttleRef = useRef(false);
  const brakeRef = useRef(false);
  const itemsRef = useRef<Item[]>([]);
  const seedRef = useRef(0);
  const boostTicksRef = useRef(0);
  const stoppedTicksRef = useRef(0);

  // Drives the hill-climb physics. Only runs while phase === "driving"; a
  // pit stop (phase === "question") simply lets this effect unmount,
  // freezing the car exactly where it is until a new driveRun resumes it.
  useEffect(() => {
    if (phase !== "driving") return;
    const id = setInterval(() => {
      const dt = TICK_MS / 1000;
      const x = carXRef.current;
      const slope = terrainSlope(x, seedRef.current);
      let v = speedRef.current;

      if (fuelRef.current > 0 && throttleRef.current) {
        v += (ACCEL - slope * SLOPE_ACCEL_FACTOR) * dt;
      } else if (brakeRef.current) {
        v -= BRAKE_DECEL * dt;
      } else {
        const gravityPull = -slope * SLOPE_ACCEL_FACTOR * 0.55;
        const friction = -Math.sign(v) * COAST_FRICTION;
        v += (gravityPull + friction) * dt;
      }
      v = Math.max(MIN_SPEED, Math.min(MAX_SPEED, v));
      speedRef.current = v;

      const nextX = Math.max(0, x + v * dt);
      carXRef.current = nextX;
      setCarX(nextX);
      setSpeed(v);

      if (boostTicksRef.current > 0) boostTicksRef.current -= 1;
      setBoosting(boostTicksRef.current > 0);

      if (throttleRef.current && fuelRef.current > 0) {
        fuelRef.current = Math.max(0, fuelRef.current - FUEL_DRAIN_PER_SEC * dt);
      }
      setFuel(fuelRef.current);

      let coinHit = 0;
      let pitstopHit: Item | null = null;
      itemsRef.current = itemsRef.current.map((item) => {
        if (item.collected || Math.abs(item.worldX - nextX) >= COLLECT_RADIUS) return item;
        if (item.kind === "coin") {
          coinHit += 1;
        } else {
          pitstopHit = item;
        }
        return { ...item, collected: true };
      });
      if (coinHit > 0 || pitstopHit) setItems(itemsRef.current);
      if (coinHit > 0) {
        setScore((s) => s + coinHit * 15);
        setCoinsCollected((c) => c + coinHit);
      }

      if (pitstopHit) {
        clearInterval(id);
        setQuestion(makeMathQuestion());
        setPicked(null);
        setResult(null);
        setPhase("question");
        return;
      }

      if (nextX >= FINISH_DISTANCE) {
        clearInterval(id);
        setOutcome("finished");
        setPhase("done");
        return;
      }

      if (fuelRef.current <= 0) {
        stoppedTicksRef.current = Math.abs(v) < 2 ? stoppedTicksRef.current + 1 : 0;
        if (stoppedTicksRef.current > STOPPED_TICKS_TO_END) {
          clearInterval(id);
          setOutcome("stranded");
          setPhase("done");
          return;
        }
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [phase, driveRun]);

  // Gas/brake via the keyboard, mirroring the on-screen pedals below —
  // keydown/keyup (not a single tap) since this is a hold-to-drive control.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (phase !== "driving") return;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        throttleRef.current = true;
        setGasPressed(true);
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        brakeRef.current = true;
        setBrakePressed(true);
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        throttleRef.current = false;
        setGasPressed(false);
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        brakeRef.current = false;
        setBrakePressed(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [phase]);

  function pressGas(down: boolean) {
    throttleRef.current = down;
    setGasPressed(down);
  }
  function pressBrake(down: boolean) {
    brakeRef.current = down;
    setBrakePressed(down);
  }

  function start() {
    const newSeed = Math.random() * 1000;
    seedRef.current = newSeed;
    carXRef.current = 0;
    speedRef.current = 0;
    fuelRef.current = FUEL_MAX;
    throttleRef.current = false;
    brakeRef.current = false;
    boostTicksRef.current = 0;
    stoppedTicksRef.current = 0;
    itemsRef.current = generateItems();

    setSeed(newSeed);
    setCarX(0);
    setSpeed(0);
    setFuel(FUEL_MAX);
    setItems(itemsRef.current);
    setScore(0);
    setCoinsCollected(0);
    setPitstopsAnswered(0);
    setGasPressed(false);
    setBrakePressed(false);
    setBoosting(false);
    setOutcome(null);
    setQuestion(null);
    setPicked(null);
    setResult(null);
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
      fuelRef.current = Math.min(FUEL_MAX, fuelRef.current + PITSTOP_FUEL_BONUS);
      speedRef.current = Math.min(MAX_SPEED, speedRef.current + PITSTOP_SPEED_KICK);
      setFuel(fuelRef.current);
      setSpeed(speedRef.current);
      setScore((s) => s + 25);
      setPitstopsAnswered((p) => p + 1);
      setSparks(makeSparks());
      boostTicksRef.current = Math.ceil(BOOST_VISUAL_MS / TICK_MS);
    }
    setTimeout(() => {
      setPhase("driving");
      setDriveRun((n) => n + 1);
    }, 1300);
  }

  // --- Derived view (pure functions of state only — safe to compute here) ---
  const camX = carX - CAR_SCREEN_X;
  const camHeight = terrainHeight(carX, seed);
  const terrainPoints = useMemo(() => {
    const points: { x: number; y: number }[] = [];
    const startWorldX = Math.floor(camX / TERRAIN_STEP) * TERRAIN_STEP;
    for (let wx = startWorldX; wx <= camX + VIEW_WIDTH + TERRAIN_STEP; wx += TERRAIN_STEP) {
      points.push({ x: wx - camX, y: BASELINE_Y - (terrainHeight(wx, seed) - camHeight) });
    }
    return points;
  }, [camX, camHeight, seed]);
  const terrainPath = useMemo(() => {
    if (terrainPoints.length === 0) return "";
    const top = terrainPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const first = terrainPoints[0];
    const last = terrainPoints[terrainPoints.length - 1];
    return `${top} L${last.x.toFixed(1)},${VIEW_HEIGHT} L${first.x.toFixed(1)},${VIEW_HEIGHT} Z`;
  }, [terrainPoints]);
  const slopeAtCar = terrainSlope(carX, seed);
  const carAngle = Math.max(-MAX_TILT_DEG, Math.min(MAX_TILT_DEG, -slopeAtCar * TILT_DEG_PER_SLOPE));
  const visibleItems = items.filter(
    (item) => !item.collected && item.worldX > camX - 20 && item.worldX < camX + VIEW_WIDTH + 20,
  );
  const visibleClouds = useMemo(
    () =>
      CLOUDS.map((c) => ({ ...c, screenX: c.worldX - camX * CLOUD_PARALLAX }))
        .filter((c) => c.screenX > -60 && c.screenX < VIEW_WIDTH + 60),
    [camX],
  );
  const finishScreenX = FINISH_DISTANCE - camX;
  const finishVisible = finishScreenX > -60 && finishScreenX < VIEW_WIDTH + 60;
  const finishGroundY = BASELINE_Y - (terrainHeight(FINISH_DISTANCE, seed) - camHeight);

  const selectedCar = CAR_TYPES.find((c) => c.id === carId) ?? CAR_TYPES[0];
  const fuelPct = Math.max(0, Math.round((fuel / FUEL_MAX) * 100));
  const distancePct = Math.min(100, Math.round((carX / FINISH_DISTANCE) * 100));
  const speedKmh = Math.max(0, Math.round(speed * 3.2));
  const fuelBarColor = fuelPct > 35 ? "#6BCB77" : fuelPct > 15 ? "#FFC93C" : "#FF6B6B";

  return (
    <div className="flex flex-col gap-4 rounded-[22px] px-3 py-5 shadow-lg" style={{ background: "linear-gradient(165deg,#ffffff,#f3eaff)" }}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[18px] font-extrabold tracking-tight">
          <span style={{ background: "linear-gradient(90deg,#B983FF,#4D96FF)", WebkitBackgroundClip: "text", color: "transparent" }}>
            ⛰️ Math Hill Climb
          </span>
        </h3>
        {(phase === "driving" || phase === "question") && (
          <span className="rounded-full bg-purple-tint px-3 py-1 font-display text-[13px] font-bold text-purple-text">⭐ {score}</span>
        )}
      </div>

      {phase === "ready" && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-[14.5px] font-semibold text-muted">
            Hold ⛽ GAS to climb the hills, tap 🛑 BRAKE to slow down or back off — just like a real hill-climb
            racer! Grab ⭐ coins, and drive into a 🧮 pit stop to answer a fractions/decimals question for a
            fuel refill and a speed boost. Don&apos;t run out of gas before the garage! 🏁
          </p>
          <div className="flex flex-col gap-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wide text-muted">🚘 Pick your ride</span>
            <div className="grid grid-cols-5 gap-2">
              {CAR_TYPES.map((car) => {
                const isSelected = car.id === carId;
                return (
                  <button
                    key={car.id}
                    onClick={() => chooseCar(car.id)}
                    aria-label={car.name}
                    aria-pressed={isSelected}
                    className={`flex flex-col items-center gap-0.5 rounded-2xl px-2 py-2 transition-transform ${
                      isSelected ? "bg-purple-tint ring-2 ring-purple-text" : "bg-divider"
                    }`}
                  >
                    <span
                      className="leading-none"
                      style={{
                        fontSize: `${18 + car.scale * 8}px`,
                        filter: `drop-shadow(0 2px 3px ${car.glow})`,
                      }}
                    >
                      {car.emoji}
                    </span>
                    <span className="text-[9.5px] font-bold text-muted">{car.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <button
            onClick={start}
            className="rounded-2xl px-6 py-3 font-display text-[15px] font-bold text-white shadow-md"
            style={{ background: "linear-gradient(135deg,#B983FF,#4D96FF)" }}
          >
            Start climbing {selectedCar.emoji}
          </button>
        </div>
      )}

      {(phase === "driving" || phase === "question") && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-divider">
              <div
                className="h-full rounded-full"
                style={{ width: `${distancePct}%`, background: "linear-gradient(90deg,#B983FF,#4D96FF)" }}
              />
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-divider">
              <div className="h-full rounded-full transition-[width]" style={{ width: `${fuelPct}%`, background: fuelBarColor }} />
            </div>
          </div>

          {/* -mx-3 bleeds this past the card's own horizontal padding (px-3
              above) so the track uses the full card width, not card-width
              minus padding on both sides — this is the actual "wider
              screen" the padding was quietly eating on narrow phones. */}
          <div className="relative -mx-3 overflow-hidden rounded-2xl shadow-inner" style={{ height: VIEW_HEIGHT, background: "linear-gradient(180deg,#8FD3F4,#D9F0FF)" }}>
            <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} width="100%" height="100%" preserveAspectRatio="none">
              <defs>
                <linearGradient id="terrainGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8FE08F" />
                  <stop offset="35%" stopColor="#5FBF6B" />
                  <stop offset="100%" stopColor="#4A3222" />
                </linearGradient>
                <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFF4C2" />
                  <stop offset="55%" stopColor="#FFD55C" />
                  <stop offset="100%" stopColor="#FFD55C" stopOpacity={0} />
                </radialGradient>
              </defs>

              <circle cx={VIEW_WIDTH - 70} cy={48} r={44} fill="url(#sunGrad)" />
              <circle cx={VIEW_WIDTH - 70} cy={48} r={15} fill="#FFEA8A" />

              {visibleClouds.map((c, i) => (
                <Puff key={i} cx={c.screenX} cy={c.y} scale={c.scale} />
              ))}

              <path d={terrainPath} fill="url(#terrainGrad)" stroke="#3F8C49" strokeWidth={3} />

              {finishVisible && (
                <g>
                  <rect x={finishScreenX - 1.5} y={finishGroundY - 72} width={3} height={72} fill="#5A4632" />
                  <rect x={finishScreenX + 1.5} y={finishGroundY - 72} width={16} height={11} fill="#1a1a1a" />
                  <rect x={finishScreenX + 1.5} y={finishGroundY - 61} width={16} height={11} fill="#fff" />
                  <rect x={finishScreenX + 9.5} y={finishGroundY - 72} width={8} height={11} fill="#fff" />
                  <rect x={finishScreenX + 1.5} y={finishGroundY - 61} width={8} height={11} fill="#1a1a1a" />
                </g>
              )}
            </svg>

            {visibleItems.map((item) => {
              const screenX = item.worldX - camX;
              const screenY = BASELINE_Y - (terrainHeight(item.worldX, seed) - camHeight) - 22;
              return (
                <span
                  key={item.id}
                  className="absolute animate-[floatBlob_2.4s_ease-in-out_infinite] text-[20px]"
                  style={{ left: screenX, top: screenY, transform: "translate(-50%,-50%)" }}
                >
                  {item.kind === "coin" ? "⭐" : "🧮"}
                </span>
              );
            })}

            {speed > 20 && (
              <>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      left: CAR_SCREEN_X - 18 - i * 11,
                      top: BASELINE_Y - 6 + i * 3,
                      width: 13,
                      height: 2,
                      background: "rgba(255,255,255,.6)",
                      opacity: Math.max(0, 0.65 - i * 0.2),
                    }}
                  />
                ))}
              </>
            )}

            <div
              className="absolute rounded-full"
              style={{
                left: CAR_SCREEN_X,
                top: BASELINE_Y + 7,
                width: 42 * selectedCar.scale,
                height: 11 * selectedCar.scale,
                background: "radial-gradient(ellipse at center, rgba(0,0,0,.4), rgba(0,0,0,0) 72%)",
                transform: "translate(-50%,-50%)",
              }}
            />

            {/* A drawn sprite, not the system car emoji — see CarSprite's
                comment for why. Anchored by translate(-50%,-100%): that
                puts the viewBox's bottom edge (the tires' contact line,
                by construction) exactly on BASELINE_Y, which is itself the
                terrain surface at the car's own x. No glyph-metric guessing
                left for either the ground contact or the facing direction
                (the sprite is drawn nose-right, matching travel, always). */}
            <div
              className="absolute"
              style={{
                left: CAR_SCREEN_X,
                top: BASELINE_Y,
                transform: `translate(-50%,-100%) rotate(${carAngle}deg) scale(${selectedCar.scale * (boosting ? 1.12 : 1)})`,
                filter: `drop-shadow(0 4px ${4 + selectedCar.scale * 3}px ${selectedCar.glow})`,
                transition: "transform 80ms linear",
              }}
            >
              {boosting && (
                // Back of the car is local x=0 (left) now that the sprite
                // itself is drawn nose-right — no mirroring to account for.
                <span
                  className="absolute top-[70%] -translate-y-1/2 text-[16px]"
                  style={{ left: -16, animation: "popStar 0.4s ease-out" }}
                >
                  🔥
                </span>
              )}
              <CarSprite car={selectedCar} />
            </div>

            {phase === "question" && question && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/55 p-4">
                <div className="relative flex w-full max-w-[280px] flex-col gap-3 rounded-2xl bg-white p-4 text-center shadow-lg">
                  <span className="font-display text-[11px] font-bold uppercase tracking-wide text-muted">🧮 Pit stop!</span>
                  <p className="font-display text-[19px] font-extrabold">{question.prompt}</p>
                  {result === "correct" && (
                    <span className="font-display text-[11.5px] font-bold text-orange">⛽ +{PITSTOP_FUEL_BONUS} fuel · 🚀 boost!</span>
                  )}
                  {sparks.map((p, i) => (
                    <span
                      key={i}
                      style={p.style}
                      className="pointer-events-none absolute left-1/2 top-10 h-1.5 w-1.5 rounded-sm animate-[confetti-fly_0.8s_ease-out_forwards]"
                    />
                  ))}
                  <div className="grid grid-cols-2 gap-2">
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
                          className={`rounded-2xl px-3 py-2.5 font-display text-[15px] font-bold transition-colors ${style}`}
                        >
                          {choice}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {phase === "driving" && (
            <div className="flex items-center justify-center gap-6">
              <button
                onPointerDown={() => pressBrake(true)}
                onPointerUp={() => pressBrake(false)}
                onPointerLeave={() => pressBrake(false)}
                aria-label="Brake"
                className={`h-14 w-20 rounded-2xl font-display text-[13px] font-extrabold transition-colors ${
                  brakePressed ? "bg-coral text-white" : "bg-divider text-ink"
                }`}
              >
                🛑 BRAKE
              </button>
              <button
                onPointerDown={() => pressGas(true)}
                onPointerUp={() => pressGas(false)}
                onPointerLeave={() => pressGas(false)}
                aria-label="Gas"
                className={`h-14 w-20 rounded-2xl font-display text-[13px] font-extrabold transition-colors ${
                  gasPressed ? "bg-green text-white" : "bg-divider text-ink"
                }`}
              >
                ⛽ GAS
              </button>
            </div>
          )}

          <p className="text-center text-[11.5px] font-bold uppercase tracking-wide text-muted">
            🏁 {distancePct}% · ⚡ {speedKmh} km/h · ⭐ {coinsCollected} · 🧮 {pitstopsAnswered}
            {boosting && " · 🚀 NITRO"}
          </p>
        </div>
      )}

      {phase === "done" && (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <p className="font-display text-[22px] font-extrabold text-purple-text">
            {outcome === "finished" ? "You reached the garage! 🏁" : "Ran out of gas! ⛽"}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Stat label="Score" value={score} />
            <Stat label="Distance" value={`${distancePct}%`} />
            <Stat label="Coins" value={coinsCollected} />
            <Stat label="Pit stops" value={pitstopsAnswered} />
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

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-divider px-4 py-2">
      <span className="font-display text-[20px] font-extrabold text-purple-text">{value}</span>
      <span className="text-[11px] font-bold uppercase tracking-wide text-muted">{label}</span>
    </div>
  );
}
