// "Đường đua toán học": the car runs by itself, the child keeps it fast by answering.
// Five right answers in a row hand out one of ten power-ups.
// Pure logic — the canvas renderer draws it and scripts/check-race.ts plays it headless.

export const VW = 720, VH = 400;
export const ROAD_Y = 300;
export const TRACK = 8000;          // world units from the start line to the chequered flag
const BASE_V = 1.6;                 // the car idles along on its own
const RIVAL_DRIFT = 1.6;            // the rival drifts at exactly that pace, so thinking time costs nobody
const RIVAL_STEP = 104;             // …and gains this much every time a question is answered
const SURGE = 110;                  // distance a right answer is worth, paid out over a few frames

export type PowerId =
  | 'nimbus' | 'rocket' | 'lightning' | 'wings' | 'shield'
  | 'magnet' | 'freeze' | 'coinrain' | 'dragon' | 'rainbow';

export interface Power {
  id: PowerId; name: string; emoji: string; color: string;
  /** Frames it lasts, speed while it runs, and whether the car leaves the road. */
  dur: number; speed: number; fly: boolean; blurb: string;
}

export const POWERS: Power[] = [
  { id: 'nimbus', name: 'Cân đẩu vân', emoji: '☁️', color: '#ffd166', dur: 300, speed: 2.4, fly: true, blurb: 'Mây vàng chở bay một đoạn thật dài' },
  { id: 'dragon', name: 'Rồng thần kéo', emoji: '🐉', color: '#8f6bff', dur: 260, speed: 2.6, fly: true, blurb: 'Rồng kéo xe bay vút lên trời' },
  { id: 'rocket', name: 'Tên lửa đẩy', emoji: '🚀', color: '#ff6b35', dur: 170, speed: 3, fly: false, blurb: 'Phụt lửa, lao đi vun vút' },
  { id: 'rainbow', name: 'Cầu vồng', emoji: '🌈', color: '#ff9ff3', dur: 220, speed: 2.2, fly: true, blurb: 'Phóng lên cầu vồng bay xa' },
  { id: 'lightning', name: 'Tia chớp', emoji: '⚡', color: '#ffe14d', dur: 230, speed: 2, fly: false, blurb: 'Chạy nhanh gấp đôi' },
  { id: 'wings', name: 'Đôi cánh', emoji: '🪽', color: '#9fe8ff', dur: 260, speed: 1.7, fly: true, blurb: 'Mọc cánh, bay qua mọi chướng ngại' },
  { id: 'shield', name: 'Khiên thần', emoji: '🛡️', color: '#7be07b', dur: 460, speed: 1.7, fly: false, blurb: 'Chướng ngại không cản được xe' },
  { id: 'magnet', name: 'Nam châm', emoji: '🧲', color: '#ff8fab', dur: 380, speed: 1.7, fly: false, blurb: 'Hút hết sao vàng ở gần' },
  { id: 'freeze', name: 'Ngưng đọng', emoji: '❄️', color: '#8fd8ff', dur: 260, speed: 1.8, fly: false, blurb: 'Xe đối thủ đứng hình' },
  { id: 'coinrain', name: 'Mưa sao vàng', emoji: '🌟', color: '#ffd21f', dur: 200, speed: 1.75, fly: false, blurb: 'Sao vàng rơi đầy đường' },
];

export const STREAK_FOR_POWER = 5;

/** Each island of the Toán 5 map gets its own scenery. */
export interface Theme { sky: [string, string]; far: string; near: string; road: string; ground: string; deco: 'tree' | 'palm' | 'cactus' | 'rock' | 'pine' | 'city' | 'volcano' }
export const THEMES: Theme[] = [
  { sky: ['#8fd8ff', '#d9f3ff'], far: '#6fbf73', near: '#49a356', road: '#5b6472', ground: '#7ac07f', deco: 'tree' },
  { sky: ['#7fd4ff', '#ffe9c7'], far: '#f2d9a0', near: '#e8c87d', road: '#6b7280', ground: '#f5e3b3', deco: 'palm' },
  { sky: ['#ffb36b', '#ffe3b0'], far: '#e0a062', near: '#c9854a', road: '#6b6257', ground: '#eab987', deco: 'cactus' },
  { sky: ['#9ec9ff', '#e7f1ff'], far: '#8c95a3', near: '#6e7787', road: '#59606b', ground: '#aab3c0', deco: 'rock' },
  { sky: ['#8ad7c0', '#e6fff7'], far: '#4f9e7a', near: '#35775b', road: '#5a6a63', ground: '#6fba95', deco: 'pine' },
  { sky: ['#6fa8ff', '#cfe4ff'], far: '#7986a8', near: '#58628a', road: '#454b5c', ground: '#8f9ab8', deco: 'city' },
  { sky: ['#4a2b5e', '#ff7a5c'], far: '#5e3a56', near: '#43283f', road: '#3a2f3d', ground: '#6b4258', deco: 'volcano' },
];

export type ItemKind = 'coin' | 'rock' | 'oil';
export interface Item { x: number; y: number; kind: ItemKind; gone: boolean }
export interface Ev { t: 'coin' | 'bump' | 'power' | 'right' | 'wrong' | 'finish'; power?: Power }

export interface Race {
  topic: string; theme: Theme;
  frame: number; phase: 'run' | 'done';
  x: number; v: number; fly: number;          // fly: 0 on the road … 1 fully airborne
  surge: number;                               // distance still owed from a right answer
  rx: number; rivalTarget: number;             // the rival, and where it is heading
  boost: number; slow: number;                 // frames left of a right-answer boost / a bump
  power: Power | null; powerT: number; lastPower: PowerId | null;
  streak: number; bestStreak: number; correct: number; wrong: number;
  coins: number; score: number;
  items: Item[]; ev: Ev[];
  won: boolean;
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

function buildTrack(): Item[] {
  const items: Item[] = [];
  for (let x = 220; x < TRACK - 120; x += rnd(70, 130)) items.push({ x, y: rnd(0, 1) < 0.25 ? 1 : 0, kind: 'coin', gone: false });
  for (let x = 500; x < TRACK - 240; x += rnd(300, 520)) items.push({ x, y: 0, kind: Math.random() < 0.5 ? 'rock' : 'oil', gone: false });
  return items.sort((a, b) => a.x - b.x);
}

export function newRace(topic: string, island = 1): Race {
  return {
    topic, theme: THEMES[Math.max(0, Math.min(THEMES.length - 1, island - 1))],
    frame: 0, phase: 'run',
    x: 0, v: BASE_V, fly: 0, surge: 0, rx: 0, rivalTarget: 0,
    boost: 0, slow: 0,
    power: null, powerT: 0, lastPower: null,
    streak: 0, bestStreak: 0, correct: 0, wrong: 0,
    coins: 0, score: 0,
    items: buildTrack(), ev: [],
    won: false,
  };
}

/** Hand out a power-up, never the same one twice running. */
function grantPower(r: Race) {
  const pool = POWERS.filter((p) => p.id !== r.lastPower);
  const p = pool[Math.floor(Math.random() * pool.length)];
  r.power = p; r.powerT = p.dur; r.lastPower = p.id;
  r.ev.push({ t: 'power', power: p });
}

/** The child answered the question on screen. Right answers are the only thing that wins the race. */
export function answer(r: Race, ok: boolean) {
  if (r.phase !== 'run') return;
  r.rivalTarget += RIVAL_STEP;   // the rival only moves on as questions are answered, right or wrong
  if (ok) {
    r.correct++; r.streak++; r.bestStreak = Math.max(r.bestStreak, r.streak);
    r.surge += SURGE; r.boost = 150; r.score += 10 + r.streak * 2;
    r.ev.push({ t: 'right' });
    if (r.streak % STREAK_FOR_POWER === 0) grantPower(r);
  } else {
    r.wrong++; r.streak = 0; r.slow = 70;
    r.ev.push({ t: 'wrong' });
  }
}

/**
 * Takes the events piled up since the last call. Both `answer` (called from a click) and `step`
 * (called on a timer) add to the same queue, so whoever draws has to drain it — clearing inside
 * `step` would throw away everything the answer just raised.
 */
export function drain(r: Race): Ev[] {
  const out = r.ev.slice();
  r.ev.length = 0;
  return out;
}

export function step(r: Race) {
  r.frame++;
  if (r.phase !== 'run') return;

  const p = r.power;
  const mult = (p ? p.speed : 1) * (r.boost > 0 ? 1.45 : 1) * (r.slow > 0 ? 0.45 : 1);
  r.v += (BASE_V * mult - r.v) * 0.07;
  const pay = Math.min(r.surge, 6);            // a right answer is a visible dash, not a teleport
  r.surge -= pay;
  r.x += r.v + pay;

  const frozen = p?.id === 'freeze' ? 0.15 : 1;
  r.rivalTarget += RIVAL_DRIFT * frozen;
  r.rivalTarget += Math.max(0, r.x - 900 - r.rivalTarget) * 0.02 * frozen;  // never a parade
  r.rx += Math.max(0, (r.rivalTarget - r.rx) * 0.06);

  const wantFly = p?.fly ? 1 : 0;
  r.fly += (wantFly - r.fly) * 0.07;

  if (r.boost > 0) r.boost--;
  if (r.slow > 0) r.slow--;
  if (r.powerT > 0 && --r.powerT === 0) r.power = null;

  const magnet = p?.id === 'magnet' ? 190 : 34;
  const rain = p?.id === 'coinrain';
  for (const it of r.items) {
    if (it.gone || Math.abs(it.x - r.x) > magnet) continue;
    if (it.kind === 'coin') {
      if (it.y > 0 && r.fly < 0.5 && !rain && p?.id !== 'magnet') continue;  // high coins need wings
      it.gone = true; r.coins++; r.score += rain ? 10 : 5; r.ev.push({ t: 'coin' });
    } else if (Math.abs(it.x - r.x) < 22) {
      it.gone = true;
      if (r.fly > 0.5 || p?.id === 'shield') continue;                        // flown over or shrugged off
      r.slow = 60; r.v *= 0.5; r.ev.push({ t: 'bump' });
    }
  }

  if (r.x >= TRACK || r.rx >= TRACK) {
    r.phase = 'done';
    r.won = r.x >= r.rx;
    r.score += r.won ? 100 : 0;
    r.ev.push({ t: 'finish' });
  }
}

/** 1–3 stars: winning matters, but so does how clean the answers were. */
export function stars(r: Race): 1 | 2 | 3 {
  const acc = r.correct + r.wrong === 0 ? 0 : r.correct / (r.correct + r.wrong);
  if (r.won && acc >= 0.85) return 3;
  if (r.won || acc >= 0.7) return 2;
  return 1;
}
