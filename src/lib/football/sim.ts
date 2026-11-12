// "Giải đấu chiến binh": top-down 5-a-side arcade football on a scrolling pitch.
// Dribble, sprint, pass, slide-tackle, charge shots at a corner, and a ki-powered special shot.
// Pure logic, no DOM — the React component draws it, scripts/check-football.ts exercises it headless.

export const VW = 640, VH = 360;          // what the camera shows
export const W = 960, H = 560;            // the whole pitch
export const GY1 = H / 2 - 62, GY2 = H / 2 + 62;
const MX = 12, MY = 14;
export const CHARGE_FULL = 40;
export const MATCH_SECONDS = 120;

export type SupKind = 'blast' | 'zigzag' | 'arrow' | 'boomerang' | 'sky' | 'leaf' | 'kame' | 'void';
export const SUP_KINDS: SupKind[] = ['kame', 'blast', 'zigzag', 'arrow', 'boomerang', 'sky', 'leaf', 'void'];

/** The first special of the match is always the beam; after that one of the others is drawn at random. */
export const FIRST_SUP: SupKind = 'kame';

export const SUPERS: Record<SupKind, { name: string; color: string }> = {
  kame: { name: 'SÓNG ÁNH SAO!', color: '#9fe8ff' },
  blast: { name: 'CẦU LỬA!', color: '#ff7a1a' },
  zigzag: { name: 'TIA SÉT!', color: '#ffe14d' },
  arrow: { name: 'MŨI TÊN BĂNG!', color: '#6fd3ff' },
  boomerang: { name: 'CHUỐI BAY VÒNG!', color: '#ffd84d' },
  sky: { name: 'THIÊN THẠCH!', color: '#c9a36b' },
  leaf: { name: 'BÃO LÁ!', color: '#7be07b' },
  void: { name: 'HỐ ĐEN!', color: '#8f6bff' },
};

/** How fast each special travels, in pixels per frame. */
const SUP_SPEED: Record<SupKind, number> = { blast: 11.5, zigzag: 8.5, arrow: 14, boomerang: 7.5, sky: 7.5, leaf: 8, kame: 10, void: 6.5 };

/** Sideways swing of a special, in pixels, at `t` of its flight (0…1). */
export function supOffset(kind: SupKind, t: number): number {
  switch (kind) {
    case 'zigzag': return Math.sin(t * Math.PI * 5) * 30 * (1 - t);
    case 'boomerang': return Math.sin(t * Math.PI) * 95;      // swings wide and curls back in
    case 'leaf': return Math.sin(t * Math.PI * 3) * 42 * (1 - t * 0.5);
    case 'void': return Math.sin(t * Math.PI * 2) * 18;
    default: return 0;
  }
}

/** Height of a special above the grass at `t` of its flight. */
export function supHeight(kind: SupKind, t: number): number {
  switch (kind) {
    case 'sky': return Math.sin(Math.PI * t) * 120;           // drops out of the sky onto the goal
    case 'arrow': return 6;
    case 'kame': return 10;
    default: return 8;
  }
}
export type HairStyle = 'spiky' | 'long' | 'cap' | 'bun' | 'mohawk' | 'hood' | 'curly' | 'band';

/** Original elemental warriors. spd / pow / tac are 1–5. */
export interface Char {
  id: string; name: string; skin: string; hair: string; style: HairStyle;
  aura: string; spd: number; pow: number; tac: number;
}

export const CHARS: Char[] = [
  { id: 'sao', name: 'Sao', skin: '#f6d7bd', hair: '#b58cff', style: 'curly', aura: '#9fe8ff', spd: 4, pow: 4, tac: 2 },
  { id: 'lua', name: 'Lửa', skin: '#f2c48d', hair: '#e8452c', style: 'spiky', aura: '#ff7a1a', spd: 3, pow: 5, tac: 2 },
  { id: 'sam', name: 'Sấm', skin: '#e9b98a', hair: '#ffd21f', style: 'mohawk', aura: '#ffe14d', spd: 5, pow: 3, tac: 2 },
  { id: 'bang', name: 'Băng', skin: '#f6d7bd', hair: '#8fd8ff', style: 'long', aura: '#6fd3ff', spd: 3, pow: 4, tac: 3 },
  { id: 'gio', name: 'Gió', skin: '#d9a273', hair: '#e9f5f2', style: 'band', aura: '#ffd84d', spd: 5, pow: 2, tac: 3 },
  { id: 'da', name: 'Đá', skin: '#b98258', hair: '#6b5a4b', style: 'cap', aura: '#c9a36b', spd: 2, pow: 4, tac: 5 },
  { id: 'la', name: 'Lá', skin: '#f2c48d', hair: '#3fae4c', style: 'bun', aura: '#7be07b', spd: 4, pow: 2, tac: 4 },
  { id: 'dem', name: 'Bóng Đêm', skin: '#c99872', hair: '#2b2440', style: 'hood', aura: '#8f6bff', spd: 3, pow: 3, tac: 4 },
];

/** How strong a CPU team (or the kid's own AI team-mates) plays. */
export interface Level {
  name: string; emoji: string; color: string;
  spd: number; gkReact: number; gkSpd: number; gkPunch: number;
  range: number; shootP: number; tackleP: number; stealP: number; kiRate: number;
}

export const LEVELS: Level[] = [
  { name: 'Đội Rùa Con', emoji: '🐢', color: '#16a34a', spd: 1.32, gkReact: 18, gkSpd: 2.1, gkPunch: 0, range: 190, shootP: 0.035, tackleP: 0.03, stealP: 0.022, kiRate: 0.3 },
  { name: 'Đội Khỉ Rừng', emoji: '🐵', color: '#b45309', spd: 1.44, gkReact: 15, gkSpd: 2.4, gkPunch: 0, range: 205, shootP: 0.04, tackleP: 0.045, stealP: 0.028, kiRate: 0.45 },
  { name: 'Đội Sói Tuyết', emoji: '🐺', color: '#475569', spd: 1.56, gkReact: 12, gkSpd: 2.7, gkPunch: 0.1, range: 220, shootP: 0.045, tackleP: 0.06, stealP: 0.034, kiRate: 0.6 },
  { name: 'Đội Rồng Lửa', emoji: '🐲', color: '#dc2626', spd: 1.7, gkReact: 10, gkSpd: 3.0, gkPunch: 0.2, range: 240, shootP: 0.05, tackleP: 0.08, stealP: 0.04, kiRate: 0.8 },
  { name: 'Đội Thần Sấm', emoji: '⚡', color: '#7c3aed', spd: 1.82, gkReact: 7, gkSpd: 3.3, gkPunch: 0.3, range: 260, shootP: 0.06, tackleP: 0.1, stealP: 0.05, kiRate: 1 },
];
const ALLY: Level = { ...LEVELS[2], name: '', gkReact: 11, gkSpd: 2.9, gkPunch: 0.15, tackleP: 0.03, stealP: 0.02 };

/**
 * How hard the game plays, on top of which team you are facing.
 * `aim` is the shooting help a young player gets: 1 = the ball goes to the corner the keeper left open.
 */
export interface Difficulty {
  id: 'de' | 'vua' | 'kho';
  name: string; emoji: string; blurb: string;
  cpu: number;      // their outfield speed
  aggro: number;    // how often they shoot, tackle and steal
  theirGk: number;  // >1 = their keeper reacts later and moves slower
  myGk: number;     // <1 = your keeper reacts sooner and moves faster
  shot: number;     // your shot power
  aim: number;      // 0…1 shooting help
  myKi: number;     // how fast your ki bar fills
  allySpd: number;  // your AI team-mates' speed
  allyAggro: number;// how hard your team-mates fight for the ball
}

export const DIFFICULTIES: Difficulty[] = [
  { id: 'de', name: 'Dễ', emoji: '😊', blurb: 'Đối thủ chạy chậm và ít sút, cú sút của bạn tự nhắm vào góc trống.',
    cpu: 0.8, aggro: 0.4, theirGk: 1.15, myGk: 0.65, shot: 1.05, aim: 0.6, myKi: 1.6, allySpd: 1.1, allyAggro: 1.7 },
  { id: 'vua', name: 'Vừa', emoji: '😐', blurb: 'Đối thủ đá rắn hơn, trợ giúp nhắm bóng ít đi. Phải biết chuyền và xoạc.',
    cpu: 0.9, aggro: 0.7, theirGk: 1.05, myGk: 0.85, shot: 1, aim: 0.4, myKi: 1.3, allySpd: 1.04, allyAggro: 1.2 },
  { id: 'kho', name: 'Khó', emoji: '😤', blurb: 'Luật chơi gốc: đối thủ lì đòn, thủ môn bắt giỏi, không có trợ giúp nhắm bóng.',
    cpu: 1, aggro: 1, theirGk: 0.95, myGk: 1, shot: 1, aim: 0, myKi: 1, allySpd: 1, allyAggro: 1 },
];
export const DEFAULT_DIFFICULTY = 0;

const scaleFoe = (base: Level, d: Difficulty): Level => ({
  ...base,
  spd: base.spd * d.cpu,
  shootP: base.shootP * d.aggro,
  tackleP: base.tackleP * d.aggro,
  stealP: base.stealP * d.aggro,
  kiRate: base.kiRate * d.aggro,
  gkReact: Math.round(base.gkReact * d.theirGk),
  gkSpd: base.gkSpd / d.theirGk,
  gkPunch: base.gkPunch / d.theirGk,
});

/** Your AI team-mates and keeper keep pace with the team you are facing, then bend with the difficulty. */
const scaleAlly = (d: Difficulty, level: number): Level => {
  const base = LEVELS[clamp(level, 1, LEVELS.length - 1)];
  return {
    ...base, name: '',
    spd: base.spd * d.allySpd,
    tackleP: ALLY.tackleP * d.allyAggro,
    stealP: ALLY.stealP * d.allyAggro,
    gkReact: Math.round(base.gkReact * d.myGk),
    gkSpd: base.gkSpd / d.myGk,
    gkPunch: base.gkPunch,
  };
};

export type Side = 0 | 1; // 0 = the kid (attacks right), 1 = CPU (attacks left)

export interface P {
  side: Side; gk: boolean; ch: number; role: number;
  x: number; y: number; vx: number; vy: number; fx: number; fy: number;
  down: number; cd: number; charge: number; slide: number; hold: number; hx: number; hy: number;
  react: number; dive: number; safe: number; kickT: number; sprint: boolean;
}
export interface Sup { kind: SupKind; x0: number; y0: number; x1: number; y1: number; t: number; dur: number; rolled: boolean }
export interface Ball {
  x: number; y: number; z: number; vx: number; vy: number; vz: number;
  owner: P | null; ks: Side; noPick: number; noP: P | null; sup: Sup | null; shot: boolean; pass: boolean;
}
export interface Msg { text: string; ttl: number; max: number; color: string }
export interface Ev { t: string; x: number; y: number; side?: Side; color?: string; kind?: SupKind }
export interface Game {
  ps: P[]; ball: Ball; score: [number, number]; ctl: P; kick: number; freeze: number;
  phase: 'play' | 'goal' | 'full'; phaseT: number; lastGoal: Side; scorer: P | null;
  msgs: Msg[]; ev: Ev[]; frame: number; prevShoot: boolean; prevPass: boolean;
  ki: [number, number]; sups: [number, number]; stamina: number; time: number; golden: boolean; goldenT: number; shotCd: [number, number];
  level: Level; ally: Level; diff: Difficulty;
}
export interface Input { dx: number; dy: number; shoot: boolean; pass: boolean; tackle: boolean; sprint: boolean }
export const emptyInput = (): Input => ({ dx: 0, dy: 0, shoot: false, pass: false, tackle: false, sprint: false });

// GK, defender, two wingers, striker — for the side attacking right
const HOME: [number, number][] = [[26, H / 2], [210, H / 2], [390, 150], [390, H - 150], [W / 2 - 60, H / 2]];
type Pt = { x: number; y: number };
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const dirOf = (s: Side) => (s === 0 ? 1 : -1);
const goalX = (s: Side) => (s === 0 ? W : 0); // the goal this side attacks
const spdF = (p: P) => 0.9 + CHARS[p.ch].spd * 0.04;
const powF = (p: P) => 0.88 + CHARS[p.ch].pow * 0.04;
const cfgOf = (g: Game, p: P) => (p.side === 1 ? g.level : g.ally);
const say = (g: Game, text: string, color: string, ttl = 80) => { g.msgs = g.msgs.slice(-1); g.msgs.push({ text, ttl, max: ttl, color }); };
const emit = (g: Game, t: string, at: Pt, extra: Partial<Ev> = {}) => g.ev.push({ t, x: at.x, y: at.y, ...extra });
const addKi = (g: Game, s: Side, n: number) => { g.ki[s] = clamp(g.ki[s] + n * (s === 1 ? g.level.kiRate : g.diff.myKi), 0, 100); };

function segDist(p: Pt, a: Pt, b: Pt) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

export function newGame(mine: number[], theirs: number[], level = 0, difficulty = DEFAULT_DIFFICULTY, seconds = MATCH_SECONDS): Game {
  const diff = DIFFICULTIES[clamp(difficulty, 0, DIFFICULTIES.length - 1)];
  const ps: P[] = [];
  ([0, 1] as Side[]).forEach((side) => {
    const team = side === 0 ? mine : theirs;
    // The keeper is a warrior nobody picked; the four picks fill the outfield from the front,
    // so pick #1 is the striker you start out controlling.
    const gkCh = CHARS.findIndex((_, i) => !team.includes(i));
    HOME.forEach(([hx, hy], i) => {
      const x = side === 0 ? hx : W - hx;
      ps.push({
        side, gk: i === 0, ch: i === 0 ? (gkCh < 0 ? 0 : gkCh) : team[(HOME.length - 1 - i) % team.length] ?? 0, role: i,
        x, y: hy, vx: 0, vy: 0, fx: dirOf(side), fy: 0, down: 0, cd: 0, charge: 0, slide: 0, hold: 0, hx: x, hy,
        react: -1, dive: 0, safe: 0, kickT: 0, sprint: false,
      });
    });
  });
  const g: Game = {
    ps, ball: { x: W / 2, y: H / 2, z: 0, vx: 0, vy: 0, vz: 0, owner: null, ks: 0, noPick: 0, noP: null, sup: null, shot: false, pass: false },
    score: [0, 0], ctl: ps[4], kick: 0, freeze: 0, phase: 'play', phaseT: 0, lastGoal: 0, scorer: null,
    msgs: [], ev: [], frame: 0, prevShoot: false, prevPass: false,
    ki: [30, 0], sups: [0, 0], shotCd: [0, 0], stamina: 100, time: seconds * 60, golden: false, goldenT: 0,
    level: scaleFoe(LEVELS[clamp(level, 0, LEVELS.length - 1)], diff), ally: scaleAlly(diff, level), diff,
  };
  kickoff(g, 0);
  return g;
}

const field = (g: Game, side: Side) => g.ps.filter((p) => p.side === side && !p.gk);
const foesOf = (g: Game, p: P) => g.ps.filter((q) => q.side !== p.side && !q.gk && q.down === 0);

/** Everyone back to their spot; `side` takes the kick-off with its striker on the ball. */
function kickoff(g: Game, side: Side) {
  for (const p of g.ps) Object.assign(p, { x: p.hx, y: p.hy, vx: 0, vy: 0, fx: dirOf(p.side), fy: 0, down: 0, slide: 0, charge: 0, hold: 0, cd: 0, react: -1, dive: 0, safe: 40 });
  const st = g.ps.find((p) => p.side === side && p.role === 4)!;
  st.x = W / 2 - dirOf(side) * 10; st.y = H / 2;
  Object.assign(g.ball, { x: W / 2, y: H / 2, z: 0, vx: 0, vy: 0, vz: 0, owner: st, ks: side, noPick: 0, noP: null, sup: null, shot: false, pass: false });
  if (side === 0) g.ctl = st;
  g.phase = 'play'; g.kick = 70;
}

function shootAt(g: Game, p: P, ty: number, power: number) {
  const b = g.ball, gx = goalX(p.side);
  let dx = gx - p.x, dy = ty - p.y;
  const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
  const sp = (6.2 + 5 * power) * powF(p);
  Object.assign(b, { vx: dx * sp, vy: dy * sp, vz: 1 + 2.2 * power, z: 2, owner: null, ks: p.side, noPick: 10, noP: p, shot: true, pass: false, sup: null });
  p.cd = 18; p.charge = 0; p.kickT = 12; p.fx = dx; p.fy = dy;
  emit(g, power > 0.75 ? 'bigkick' : 'kick', p);
}

function clearBall(g: Game, p: P, power: number) {
  const sp = (6 + 4 * power) * powF(p);
  Object.assign(g.ball, { vx: p.fx * sp, vy: p.fy * sp, vz: 2.5, z: 2, owner: null, ks: p.side, noPick: 10, noP: p, shot: false, pass: false, sup: null });
  p.cd = 18; p.charge = 0; p.kickT = 12;
  emit(g, 'kick', p);
}

/** Beam first, then any of the others at random — the shot does not depend on who takes it. */
function pickSup(g: Game, side: Side): SupKind {
  if (g.sups[side]++ === 0) return FIRST_SUP;
  const rest = SUP_KINDS.filter((k) => k !== FIRST_SUP);
  return rest[Math.floor(Math.random() * rest.length)];
}

function special(g: Game, p: P) {
  const kind = pickSup(g, p.side), meta = SUPERS[kind];
  const gx = goalX(p.side), y1 = H / 2 + rnd(-38, 38);
  const sp = SUP_SPEED[kind];
  g.ball.sup = { kind, x0: p.x, y0: p.y, x1: gx + dirOf(p.side) * 6, y1, t: 0, dur: Math.max(14, Math.hypot(gx - p.x, y1 - p.y) / sp), rolled: false };
  Object.assign(g.ball, { owner: null, ks: p.side, noPick: 0, noP: p, shot: false, pass: false, vz: 0 });
  g.ki[p.side] = 0; p.cd = 30; p.charge = 0; p.kickT = 16; p.fx = dirOf(p.side); p.fy = 0;
  g.freeze = 26;
  say(g, meta.name, meta.color, 90);
  emit(g, 'super', p, { color: meta.color, side: p.side, kind });
}

/** Where a human shot goes. With aim help it drifts to the corner the keeper has left open. */
function humanAim(g: Game, p: P, dy: number): number {
  const a = g.diff.aim;
  if (Math.abs(dy) > 0.3) return H / 2 + Math.sign(dy) * 46 + rnd(-14, 14) * (1 - a); // kid picked a corner: help only tightens it
  const k = g.ps.find((q) => q.gk && q.side !== p.side);
  const open = k ? H / 2 + (k.y <= H / 2 ? 1 : -1) * 46 : H / 2;
  return (H / 2 + rnd(-30, 30)) * (1 - a) + open * a;
}

function passTo(g: Game, p: P, q: P, lob = false) {
  const b = g.ball, tx = q.x + q.vx * 10, ty = q.y + q.vy * 10, d = Math.hypot(tx - p.x, ty - p.y) || 1;
  const sp = clamp(4.6 + d / 60, 5.2, lob ? 9.5 : 8);
  Object.assign(b, { vx: ((tx - p.x) / d) * sp, vy: ((ty - p.y) / d) * sp, vz: lob ? 3.6 : 0.6, z: 2, owner: null, ks: p.side, noPick: 8, noP: p, shot: false, pass: true, sup: null });
  p.cd = 12; p.charge = 0; p.kickT = 10; p.fx = (tx - p.x) / d; p.fy = (ty - p.y) / d;
  emit(g, 'kick', p);
}

/** Team-mate the player is facing (humans), preferring ones nobody is marking. */
function bestMate(g: Game, p: P, facing: boolean): P | null {
  const foes = foesOf(g, p);
  let best: P | null = null, bestS = -1e9;
  for (const q of field(g, p.side)) {
    if (q === p || q.down > 0 || dist(p, q) < 24) continue;
    const d = dist(p, q), open = Math.min(120, ...foes.map((f) => dist(f, q)));
    const blocked = foes.some((f) => segDist(f, p, q) < 13) ? 60 : 0;
    const s = facing
      ? (((q.x - p.x) * p.fx + (q.y - p.y) * p.fy) / d) * 140 - d * 0.12 + open * 0.2 - blocked * 0.5
      : (q.x - p.x) * dirOf(p.side) * 0.5 + open * 0.8 - blocked - Math.abs(d - 170) * 0.15;
    if (s > bestS) { bestS = s; best = q; }
  }
  return best;
}

interface Act { mx: number; my: number; spd?: number; shoot?: { ty: number; power: number }; special?: boolean; pass?: P | null; lob?: boolean; tackle?: boolean }

function keeper(g: Game, p: P): Act {
  const b = g.ball, cfg = cfgOf(g, p), dir = dirOf(p.side);
  if (b.owner === p) {
    p.fx = dir; p.fy = 0; p.react = -1; p.dive = 0;
    return p.hold > 34 ? { mx: 0, my: 0, pass: bestMate(g, p, false), lob: true } : { mx: 0, my: 0 };
  }
  const coming = !b.owner && !b.sup && b.vx * -dir > 1.5 && Math.abs(b.x - p.hx) < 420;
  if (coming) {
    const ty = b.y + b.vy * ((p.hx - b.x) / b.vx);
    if (ty > GY1 - 28 && ty < GY2 + 28) {
      if (p.react < 0) p.react = cfg.gkReact;
      if (p.react > 0) { p.react--; return { mx: 0, my: 0 }; }
      const goY = clamp(ty, GY1 + 4, GY2 - 4) - p.y;
      p.dive = Math.abs(goY) > 8 ? Math.sign(goY) : 0;
      return { mx: (p.hx - p.x) * 0.5, my: goY, spd: cfg.gkSpd };
    }
  }
  p.react = -1; p.dive = 0;
  // sweep up a slow loose ball in the box
  if (!b.owner && !b.sup && Math.hypot(b.vx, b.vy) < 2.5 && dist(p, b) < 80 && !g.ps.some((q) => q.side !== p.side && dist(q, b) < dist(p, b))) {
    return { mx: b.x - p.x, my: b.y - p.y, spd: 1.9 };
  }
  return { mx: p.hx + dir * clamp(Math.abs(b.x - p.hx) * 0.04, 0, 22) - p.x, my: clamp(H / 2 + (b.y - H / 2) * 0.42, GY1 + 10, GY2 - 10) - p.y, spd: 1.6 };
}

function decide(g: Game, p: P, presser: P | undefined, cover: P | undefined): Act {
  if (p.gk) return keeper(g, p);
  const b = g.ball, cfg = cfgOf(g, p), dir = dirOf(p.side), gx = goalX(p.side), foes = foesOf(g, p);

  if (b.owner === p) {
    const toGoal = Math.abs(gx - p.x);
    if (g.ki[p.side] >= 100 && toGoal < 360 && Math.random() < 0.06) return { mx: 0, my: 0, special: true };
    const target = { x: gx, y: H / 2 };
    const lane = !foes.some((f) => segDist(f, p, target) < 15 && dist(f, p) < 130);
    if (toGoal < cfg.range && p.cd <= 0 && g.shotCd[p.side] <= 0 && (lane || toGoal < 110) && Math.random() < cfg.shootP * (lane ? 2 : 0.7)) {
      const corner = Math.random() < 0.35 + cfg.kiRate * 0.4;
      return { mx: 0, my: 0, shoot: { ty: H / 2 + (corner ? (Math.random() < 0.5 ? -1 : 1) * rnd(34, 54) : rnd(-30, 30)), power: rnd(0.55, 0.75 + cfg.kiRate * 0.25) } };
    }
    const near = foes.filter((f) => dist(f, p) < 46);
    if (near.length && p.cd <= 0 && Math.random() < 0.05) {
      const m = bestMate(g, p, false);
      if (m && (m.x - p.x) * dir > -60) return { mx: 0, my: 0, pass: m };
    }
    // run at goal, steering away from nearby defenders
    let sx = gx - p.x, sy = (H / 2 - p.y) * (toGoal < 220 ? 1 : 0.3);
    const l = Math.hypot(sx, sy) || 1; sx /= l; sy /= l;
    for (const f of foes) { const d = dist(f, p); if (d < 70 && (f.x - p.x) * dir > -10) { sx -= ((f.x - p.x) / d) * (26 / d); sy -= ((f.y - p.y) / d) * (60 / d); } }
    return { mx: sx * 50, my: sy * 50 };
  }

  const carrier = b.owner;
  const shift = (k: number, push: number) => ({
    mx: clamp(p.hx + (b.x - W / 2) * k + dir * push, MX + 30, W - MX - 30) - p.x,
    my: clamp(p.hy + (b.y - H / 2) * 0.3, MY + 10, H - MY - 10) - p.y,
  });

  if (!carrier) {
    if (p === presser && !b.sup) return { mx: b.x + b.vx * 8 - p.x, my: b.y + b.vy * 8 - p.y };
    return shift(0.45, 0);
  }
  if (carrier.side === p.side) {
    // support the attack: striker hangs near the box, the rest follow the ball up the pitch
    const a = shift(0.55, p.role === 4 ? 150 : p.role === 1 ? 20 : 90);
    if (p.role === 4) a.my = clamp(H / 2 + (carrier.y < H / 2 ? 70 : -70), MY, H - MY) - p.y;
    return a;
  }
  if (carrier.gk) return shift(0.4, -20);
  if (p === presser) {
    const d = dist(p, carrier);
    return { mx: carrier.x + carrier.vx * 6 - p.x, my: carrier.y + carrier.vy * 6 - p.y, tackle: d < 30 && d > 12 && p.cd <= 0 && Math.random() < cfg.tackleP };
  }
  if (p === cover) {
    const own = { x: goalX(p.side === 0 ? 1 : 0), y: H / 2 };
    return { mx: carrier.x + (own.x - carrier.x) * 0.35 - p.x, my: carrier.y + (own.y - carrier.y) * 0.35 - p.y };
  }
  return shift(0.45, -40);
}

function chooseCtl(g: Game, wantSwitch: boolean) {
  const b = g.ball, mates = field(g, 0);
  if (b.owner && b.owner.side === 0 && !b.owner.gk) { g.ctl = b.owner; return; }
  if (g.ctl.slide > 0) return;
  const ref = b.owner ?? { x: b.x + b.vx * 6, y: b.y + b.vy * 6 };
  const sorted = mates.filter((m) => m.down === 0).sort((a, c) => dist(a, ref) - dist(c, ref));
  if (!sorted.length) return;
  if (wantSwitch) { g.ctl = sorted[0] === g.ctl && sorted[1] ? sorted[1] : sorted[0]; return; }
  if (g.ctl.down > 0 || (sorted[0] !== g.ctl && dist(g.ctl, ref) - dist(sorted[0], ref) > 45)) g.ctl = sorted[0];
}

function act(g: Game, p: P, a: Act, human: boolean, inp: Input | null) {
  const b = g.ball, cfg = cfgOf(g, p);
  if (p.cd > 0) p.cd--;
  if (p.safe > 0) p.safe--;
  if (p.kickT > 0) p.kickT--;
  p.sprint = false;
  if (p.down > 0) {
    p.down--; p.vx *= 0.8; p.vy *= 0.8; p.slide = 0; p.charge = 0;
    if (b.owner === p) { b.owner = null; b.vx = p.fx * 1.5; b.vy = p.fy * 1.5; }
    return;
  }
  const holding = b.owner === p;
  let sp = human ? 1.95 : (a.spd ?? cfg.spd);
  if (!p.gk) sp *= spdF(p);
  if (holding) sp *= 0.9;
  if (human && inp?.sprint && g.stamina > 1 && (inp.dx || inp.dy)) { sp *= 1.4; g.stamina = Math.max(0, g.stamina - 0.45); p.sprint = true; }
  if (p.charge > 8) sp *= 0.75; // winding up a shot slows you down
  if (p.slide > 0) {
    p.slide--; p.vx = p.fx * 4; p.vy = p.fy * 4;
  } else {
    const l = Math.hypot(a.mx, a.my);
    let tx = 0, ty = 0;
    if (l > (human ? 0.15 : 3)) { // sticks give a 0..1 vector, AI gives a pixel offset to its target
      tx = (a.mx / l) * sp; ty = (a.my / l) * sp;
      if (!human && l < 12) { tx *= l / 12; ty *= l / 12; }
      p.fx = a.mx / l; p.fy = a.my / l;
    }
    p.vx += (tx - p.vx) * 0.3; p.vy += (ty - p.vy) * 0.3;
  }
  p.x = clamp(p.x + p.vx, MX, W - MX); p.y = clamp(p.y + p.vy, MY, H - MY);

  if (human && inp) {
    if (holding) {
      if (inp.shoot) p.charge = Math.min(p.charge + 1, 60);
      else if (g.prevShoot && p.charge > 0) {
        const dir = dirOf(p.side);
        if (p.charge >= CHARGE_FULL && g.ki[p.side] >= 100) special(g, p);
        else if (p.fx * dir < -0.25) clearBall(g, p, Math.min(1, p.charge / CHARGE_FULL));
        else {
          const f = Math.min(1, p.charge / CHARGE_FULL);
          shootAt(g, p, humanAim(g, p, inp.dy), Math.min(1.2, (0.35 + 0.15 * g.diff.aim + 0.65 * f) * g.diff.shot));
        }
      } else p.charge = 0;
      if (inp.pass && !g.prevPass && b.owner === p && p.cd <= 0) { const m = bestMate(g, p, true); if (m) passTo(g, p, m); }
    } else p.charge = 0;
  } else if (holding) {
    if (a.special) special(g, p);
    else if (a.shoot) { shootAt(g, p, a.shoot.ty, a.shoot.power); g.shotCd[p.side] = 50; }
    else if (a.pass) passTo(g, p, a.pass, a.lob);
  }

  const still = b.owner !== p;
  if ((human ? inp?.tackle : a.tackle) && still && p.cd <= 0 && p.slide === 0 && !p.gk) { p.slide = 16; p.cd = 50; emit(g, 'slide', p); }

  const carrier = b.owner;
  if (p.slide > 0) {
    const reach = 12 + CHARS[p.ch].tac;
    for (const q of g.ps) {
      if (q.side === p.side || q.down > 0 || q.gk || dist(p, q) > reach) continue;
      q.down = 50; q.vx = p.fx * 2; q.vy = p.fy * 2; emit(g, 'tackle', q);
      if (b.owner === q) { b.owner = p; p.safe = 30; p.hold = 0; addKi(g, p.side, 16); }
    }
  } else if (still && !p.gk && carrier && carrier.side !== p.side && !carrier.gk && carrier.safe <= 0 && dist(p, carrier) < 13
    && Math.random() < (human ? 0.07 : cfg.stealP)) {
    b.owner = p; p.safe = 30; p.hold = 0; carrier.cd = 20; addKi(g, p.side, 12); emit(g, 'steal', p);
  }
  if (b.owner === p && p.gk) p.hold++; else p.hold = 0;
}

function endMatch(g: Game) {
  g.phase = 'full';
  say(g, 'HẾT GIỜ!', '#ffffff', 200);
  emit(g, 'fulltime', g.ball);
}

function goal(g: Game, scorer: Side) {
  const b = g.ball;
  g.score[scorer]++; g.lastGoal = scorer; g.phase = 'goal'; g.phaseT = 150;
  g.scorer = b.noP && b.noP.side === scorer ? b.noP : null;
  say(g, scorer === 0 ? 'VÀOOOO!!! ⚽' : 'Bị thủng lưới…', scorer === 0 ? '#ffe14d' : '#ff8a8a', 130);
  emit(g, 'goal', b, { side: scorer });
  b.sup = null; b.shot = false; b.owner = null; b.vx *= 0.3; b.vy *= 0.3;
  addKi(g, scorer === 0 ? 1 : 0, 20); // the side that conceded gets fired up
  for (const p of g.ps) { p.charge = 0; p.slide = 0; }
}

function moveBall(g: Game) {
  const b = g.ball;
  if (b.owner) {
    const o = b.owner;
    b.x = clamp(o.x + o.fx * 10, 2, W - 2); b.y = clamp(o.y + o.fy * 10, 4, H - 4); b.z = 0; b.vx = o.vx; b.vy = o.vy; b.vz = 0; b.shot = false; b.pass = false;
    return;
  }
  if (b.noPick > 0) b.noPick--;

  if (b.sup) {
    const s = b.sup, px = b.x, py = b.y;
    s.t += 1 / s.dur;
    const t = Math.min(1, s.t), lx = s.x1 - s.x0, ly = s.y1 - s.y0, len = Math.hypot(lx, ly) || 1;
    const off = supOffset(s.kind, t);
    // the sideways swing has to stay on the pitch: a wide curve on a steep shot would fly off the side
    b.x = clamp(s.x0 + lx * t + (-ly / len) * off, -14, W + 14); b.y = clamp(s.y0 + ly * t + (lx / len) * off, 6, H - 6);
    b.z = supHeight(s.kind, t);
    b.vx = b.x - px; b.vy = b.y - py;
    for (const q of g.ps) {
      if (q.side === b.ks || q.down > 0 || b.z > 30 || dist(q, b) > 17) continue;
      if (q.gk && !s.rolled) {
        s.rolled = true;
        if (Math.random() < cfgOf(g, q).gkPunch) { // heroic punch-away
          Object.assign(b, { sup: null, vx: dirOf(q.side) * rnd(3, 5), vy: rnd(-4, 4), vz: 4, noPick: 16, noP: q, shot: false });
          say(g, 'ĐẤM BÓNG!', '#9fe8ff'); emit(g, 'save', q); return;
        }
      }
      q.down = q.gk ? 90 : 70; q.vx = b.vx * 0.4; q.vy = b.vy * 0.4; emit(g, 'tackle', q);
    }
    if (s.t >= 1) goal(g, b.ks);
    return;
  }

  b.x += b.vx; b.y += b.vy; b.z += b.vz;
  if (b.z > 0) { b.vz -= 0.28; b.vx *= 0.996; b.vy *= 0.996; }
  if (b.z <= 0) {
    b.z = 0;
    if (b.vz < -1.4) { b.vz = -b.vz * 0.45; emit(g, 'bounce', b); } else b.vz = 0;
    b.vx *= 0.975; b.vy *= 0.975;
  }
  if (Math.hypot(b.vx, b.vy) < 0.06) { b.vx = b.vy = 0; b.shot = false; }
  if (b.y < 6) { b.y = 6; b.vy = Math.abs(b.vy) * 0.75; }
  if (b.y > H - 6) { b.y = H - 6; b.vy = -Math.abs(b.vy) * 0.75; }
  if (b.x < 0 || b.x > W) {
    const left = b.x < 0;
    if (Math.abs(b.y - GY1) < 4 || Math.abs(b.y - GY2) < 4) {
      b.x = left ? 0 : W; b.vx = -b.vx * 0.7; b.vy += b.y < H / 2 ? -1.5 : 1.5; b.shot = false;
      say(g, 'CỘT DỌC!', '#ffffff', 50); emit(g, 'post', b); return;
    }
    if (b.y > GY1 && b.y < GY2 && b.z < 38) { goal(g, left ? 1 : 0); return; }
    b.x = left ? 0 : W; b.vx = -b.vx * 0.7; b.shot = false;
  }

  let best: P | null = null;
  for (const q of g.ps) {
    if (q.down > 0 || (q === b.noP && b.noPick > 0)) continue;
    const d = dist(q, b);
    if (d < (q.gk ? 17 : 12) && b.z < (q.gk ? 42 : 14) && (!best || d < dist(best, b))) best = q;
  }
  if (!best) return;
  const speed = Math.hypot(b.vx, b.vy);
  if (best.gk && b.shot && b.ks !== best.side) {
    addKi(g, b.ks, 9);
    if (speed > 8.6) { // too hot to hold: parried back into play
      Object.assign(b, { vx: dirOf(best.side) * rnd(2.5, 4.5), vy: rnd(-3.5, 3.5), vz: 3, noPick: 18, noP: best, shot: false });
      say(g, 'CỨU THUA!', '#9fe8ff', 50); emit(g, 'save', best); return;
    }
    say(g, 'BẮT GỌN!', '#9fe8ff', 45); emit(g, 'save', best);
  } else if (b.pass && b.ks === best.side && best !== b.noP) {
    addKi(g, best.side, 14); emit(g, 'recv', best);
  }
  b.owner = best; best.hold = 0; best.safe = 22; b.vx = b.vy = b.vz = 0; b.z = 0; b.shot = false; b.pass = false;
}

export function step(g: Game, inp: Input | null) {
  g.frame++; g.ev.length = 0;
  g.msgs = g.msgs.filter((m) => --m.ttl > 0);
  if (g.phase === 'full') return;
  if (g.freeze > 0) { g.freeze--; return; }
  if (g.phase === 'goal') {
    // ball rolls into the net, scorer runs off celebrating
    const b = g.ball; b.x = clamp(b.x + b.vx, -14, W + 14); b.y += b.vy; b.vx *= 0.9; b.vy *= 0.9; b.z = Math.max(0, b.z + (b.vz -= 0.28));
    for (const p of g.ps) { p.vx *= 0.85; p.vy *= 0.85; if (p.down > 0) p.down--; }
    if (g.scorer) { const s = g.scorer; s.fx = -dirOf(s.side); s.fy = 0; s.vx = s.fx * 1.6; s.x = clamp(s.x + s.vx, MX, W - MX); }
    if (--g.phaseT <= 0) { if (g.golden) endMatch(g); else kickoff(g, g.lastGoal === 0 ? 1 : 0); }
    return;
  }
  if (g.kick > 0) { if (--g.kick === 0) emit(g, 'whistle', g.ball); g.prevShoot = !!inp?.shoot; g.prevPass = !!inp?.pass; return; }

  if (!g.golden) {
    if (--g.time <= 0) {
      if (g.score[0] === g.score[1]) { g.golden = true; g.goldenT = 40 * 60; say(g, 'BÀN THẮNG VÀNG!', '#ffe14d', 120); emit(g, 'whistle', g.ball); }
      else return endMatch(g);
    }
  } else if (--g.goldenT <= 0) return endMatch(g);

  addKi(g, 0, 0.04); addKi(g, 1, 0.04);
  if (g.shotCd[0] > 0) g.shotCd[0]--;
  if (g.shotCd[1] > 0) g.shotCd[1]--;
  if (!g.ctl.sprint) g.stamina = Math.min(100, g.stamina + 0.3);

  const b = g.ball;
  chooseCtl(g, !!inp?.pass && !g.prevPass && !(b.owner && b.owner.side === 0));

  const presser: Record<number, P | undefined> = {}, cover: Record<number, P | undefined> = {};
  ([0, 1] as Side[]).forEach((s) => {
    const ref = b.owner ?? { x: b.x + b.vx * 8, y: b.y + b.vy * 8 };
    const ai = field(g, s).filter((q) => q.down === 0 && !(inp && q === g.ctl)).sort((a, c) => dist(a, ref) - dist(c, ref));
    if (s === 0 && inp) {
      // the kid presses; one AI mate only helps when it is close or the kid is far away
      const far = dist(g.ctl, ref) > 150;
      presser[s] = ai[0] && (far || (b.owner && dist(ai[0], ref) < 110)) ? ai[0] : undefined;
      cover[s] = presser[s] ? ai[1] : ai[0];
    } else { presser[s] = ai[0]; cover[s] = ai[1]; }
  });
  for (const p of g.ps) {
    const human = p === g.ctl && inp !== null;
    act(g, p, human ? { mx: inp!.dx, my: inp!.dy } : decide(g, p, presser[p.side], cover[p.side]), human, inp);
  }
  g.prevShoot = !!inp?.shoot; g.prevPass = !!inp?.pass;

  // players shove each other apart a little so nobody stacks on one spot
  for (let i = 0; i < g.ps.length; i++) for (let j = i + 1; j < g.ps.length; j++) {
    const a = g.ps[i], c = g.ps[j], d = dist(a, c);
    if (d > 0 && d < 13) { const k = (13 - d) / 2 / d, ox = (c.x - a.x) * k, oy = (c.y - a.y) * k; a.x -= ox; a.y -= oy; c.x += ox; c.y += oy; }
  }
  for (const p of g.ps) { p.x = clamp(p.x, MX, W - MX); p.y = clamp(p.y, MY, H - MY); }

  moveBall(g);
}
