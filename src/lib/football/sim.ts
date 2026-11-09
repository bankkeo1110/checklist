// Top-down 4v4 arcade soccer in the spirit of Nekketsu Soccer League: dribble, pass, slide-tackle
// (knocks players down) and a charged "special shot" that blasts through defenders.
// Pure logic, no DOM — the React component draws it, scripts/check-football.ts exercises it headless.

export const W = 640, H = 360, GY1 = 135, GY2 = 225, MX = 8, MY = 12;

export interface Char {
  id: string; name: string; skin: string; hair: string;
  style: 'spike' | 'flame' | 'bald' | 'turban' | 'dome' | 'antenna';
  outfit: string; trim: string; shot: string; shotColor: string;
}

export const CHARS: Char[] = [
  { id: 'goku', name: 'Goku', skin: '#f1c27d', hair: '#1a1a1a', style: 'spike', outfit: '#ff7a00', trim: '#1f4fd8', shot: 'KAMEHAMEHA!', shotColor: '#4cc9ff' },
  { id: 'vegeta', name: 'Vegeta', skin: '#f1c27d', hair: '#1a1a1a', style: 'flame', outfit: '#2a47c4', trim: '#f4f4f4', shot: 'GALICK GUN!', shotColor: '#b66dff' },
  { id: 'piccolo', name: 'Piccolo', skin: '#6fbf4a', hair: '#f4f4f4', style: 'turban', outfit: '#7b2fbf', trim: '#f4f4f4', shot: 'SPECIAL BEAM CANNON!', shotColor: '#ffe14d' },
  { id: 'krillin', name: 'Krillin', skin: '#f1c27d', hair: '#f1c27d', style: 'bald', outfit: '#ff7a00', trim: '#1f4fd8', shot: 'KIENZAN!', shotColor: '#ffd23f' },
  { id: 'gohan', name: 'Gohan', skin: '#f1c27d', hair: '#1a1a1a', style: 'spike', outfit: '#7b2fbf', trim: '#ffd23f', shot: 'MASENKO!', shotColor: '#ffd23f' },
  { id: 'trunks', name: 'Trunks', skin: '#f1c27d', hair: '#a77bff', style: 'spike', outfit: '#3b5bdb', trim: '#e9e9e9', shot: 'BURNING ATTACK!', shotColor: '#ff9f43' },
  { id: 'frieza', name: 'Frieza', skin: '#f4f4f4', hair: '#8e44ad', style: 'dome', outfit: '#8e44ad', trim: '#f4f4f4', shot: 'DEATH BEAM!', shotColor: '#ff4d6d' },
  { id: 'buu', name: 'Majin Buu', skin: '#ff9ec7', hair: '#ff9ec7', style: 'antenna', outfit: '#f4f4f4', trim: '#222', shot: 'CHOCOLATE BEAM!', shotColor: '#ff70a6' },
];

export type Side = 0 | 1; // 0 = player (attacks right), 1 = CPU (attacks left)

export interface P {
  side: Side; gk: boolean; ch: number;
  x: number; y: number; vx: number; vy: number; fx: number; fy: number;
  down: number; cd: number; charge: number; slide: number; hold: number; hx: number; hy: number;
}
export interface Ball { x: number; y: number; vx: number; vy: number; owner: P | null; sup: boolean; ks: Side; noPick: number; noP: P | null }
export interface Msg { text: string; ttl: number; color: string }
export interface Game {
  ps: P[]; ball: Ball; score: [number, number]; ctl: P; kick: number;
  msgs: Msg[]; ev: string[]; frame: number; prevShoot: boolean;
}
export interface Input { dx: number; dy: number; shoot: boolean; pass: boolean; tackle: boolean }

const HOME: [number, number][] = [[22, 180], [150, 100], [150, 260], [240, 180]];
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export function newGame(mine: number[], theirs: number[]): Game {
  const ps: P[] = [];
  ([0, 1] as Side[]).forEach((side) => {
    const team = side === 0 ? mine : theirs;
    HOME.forEach(([hx, hy], i) => {
      const x = side === 0 ? hx : W - hx;
      ps.push({ side, gk: i === 0, ch: team[Math.max(0, i - 1)] ?? 0, x, y: hy, vx: 0, vy: 0, fx: side === 0 ? 1 : -1, fy: 0, down: 0, cd: 0, charge: 0, slide: 0, hold: 0, hx: x, hy });
    });
  });
  return {
    ps, ball: { x: W / 2, y: H / 2, vx: 0, vy: 0, owner: null, sup: false, ks: 0, noPick: 0, noP: null },
    score: [0, 0], ctl: ps[3], kick: 60, msgs: [], ev: [], frame: 0, prevShoot: false,
  };
}

const field = (g: Game, side: Side) => g.ps.filter((p) => p.side === side && !p.gk);

function goalCenter(side: Side) { return { x: side === 0 ? W : 0, y: H / 2 }; }

function shoot(g: Game, p: P, special: boolean, noisy: boolean) {
  const gc = goalCenter(p.side);
  let tx = gc.x - p.x, ty = (noisy ? rnd(GY1 + 12, GY2 - 12) : gc.y) - p.y;
  const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
  let dx = noisy ? tx : p.fx * 0.5 + tx * 0.5, dy = noisy ? ty : p.fy * 0.5 + ty * 0.5;
  const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
  const sp = special ? 9.5 : 5.6;
  Object.assign(g.ball, { vx: dx * sp, vy: dy * sp, owner: null, sup: special, ks: p.side, noPick: 10, noP: p });
  p.cd = 20; p.charge = 0;
  g.ev.push(special ? 'super' : 'kick');
  if (special) g.msgs.push({ text: CHARS[p.ch].shot, ttl: 70, color: CHARS[p.ch].shotColor });
}

function pass(g: Game, p: P) {
  const mates = field(g, p.side).filter((q) => q !== p && q.down === 0 && dist(p, q) > 20);
  if (!mates.length) return;
  let best = mates[0], bestScore = -2;
  for (const q of mates) {
    const d = dist(p, q) || 1;
    const s = ((q.x - p.x) * p.fx + (q.y - p.y) * p.fy) / d - d / 900;
    if (s > bestScore) { bestScore = s; best = q; }
  }
  const d = dist(p, best) || 1;
  Object.assign(g.ball, { vx: ((best.x - p.x) / d) * 6.2, vy: ((best.y - p.y) / d) * 6.2, owner: null, sup: false, ks: p.side, noPick: 8, noP: p });
  p.cd = 12; p.charge = 0;
  g.ev.push('kick');
}

interface Act { mx: number; my: number; shoot?: 'n' | 's'; pass?: boolean; tackle?: boolean }

function decide(g: Game, p: P, chaser: P | undefined): Act {
  const b = g.ball;
  const dir = p.side === 0 ? 1 : -1;
  if (p.gk) {
    if (b.owner === p) {
      p.fx = dir; p.fy = 0;
      return { mx: 0, my: 0, pass: p.hold > 40 };
    }
    return { mx: p.hx - p.x, my: clamp(b.y, GY1 + 8, GY2 - 8) - p.y };
  }
  if (b.owner === p) {
    const gc = goalCenter(p.side);
    const foe = g.ps.filter((q) => q.side !== p.side && !q.gk && q.down === 0 && Math.abs(q.x - p.x) < 40 && Math.abs(q.y - p.y) < 30)[0];
    const toGoal = Math.abs(p.x - gc.x);
    if (toGoal < 175 && p.cd <= 0 && Math.random() < 0.03) return { mx: 0, my: 0, shoot: Math.random() < 0.2 ? 's' : 'n' };
    if (foe && Math.random() < 0.04) return { mx: 0, my: 0, pass: true };
    return { mx: gc.x - p.x, my: (foe ? (p.y < foe.y ? -60 : 60) : gc.y - p.y) };
  }
  const carrier = b.owner;
  if (p === chaser) {
    const t = carrier && carrier.side !== p.side ? carrier : b;
    const near = carrier && carrier.side !== p.side && dist(p, carrier) < 24 && p.cd <= 0;
    return { mx: t.x - p.x, my: t.y - p.y, tackle: !!near };
  }
  const attacking = carrier && carrier.side === p.side;
  return {
    mx: clamp(p.hx + (b.x - W / 2) * 0.35 + (attacking ? dir * 60 : 0), MX, W - MX) - p.x,
    my: clamp(p.hy + (b.y - H / 2) * 0.25, MY, H - MY) - p.y,
  };
}

function chooseCtl(g: Game) {
  const b = g.ball;
  const mates = field(g, 0);
  if (b.owner && b.owner.side === 0 && !b.owner.gk) { g.ctl = b.owner; return; }
  const ref = b.owner ?? b;
  const near = mates.reduce((a, c) => (dist(c, ref) < dist(a, ref) ? c : a));
  if (near !== g.ctl && dist(g.ctl, ref) - dist(near, ref) > 25) g.ctl = near;
}

function act(g: Game, p: P, a: Act, human: boolean, inp: Input | null) {
  const b = g.ball;
  if (p.cd > 0) p.cd--;
  if (p.down > 0) {
    p.down--; p.vx = p.vy = 0; p.slide = 0; p.charge = 0;
    if (b.owner === p) b.owner = null;
    return;
  }
  let mx = a.mx, my = a.my;
  const sp = (human ? 1.7 : p.side === 1 ? 1.3 : 1.6) * (b.owner === p ? 0.9 : 1) * (p.gk ? 0.8 : 1);
  if (p.slide > 0) {
    p.slide--; p.vx = p.fx * 3.4; p.vy = p.fy * 3.4;
  } else {
    const l = Math.hypot(mx, my);
    if (l > (human ? 0.1 : 3)) { // keys give a 0..1 vector, AI gives a pixel offset to its target
      mx /= l; my /= l; p.fx = mx; p.fy = my; p.vx = mx * sp; p.vy = my * sp; } else { p.vx = p.vy = 0; }
  }
  p.x = clamp(p.x + p.vx, MX, W - MX); p.y = clamp(p.y + p.vy, MY, H - MY);

  const holding = b.owner === p;
  if (human && inp) {
    if (inp.shoot && holding) p.charge++;
    if (!inp.shoot && g.prevShoot && holding) shoot(g, p, p.charge >= 60, false);
    else if (!inp.shoot) p.charge = 0;
    if (inp.pass && holding && p.cd <= 0) pass(g, p);
  } else {
    if (a.shoot && holding) shoot(g, p, a.shoot === 's', true);
    if (a.pass && holding) pass(g, p);
  }
  const wantsTackle = human ? inp?.tackle : a.tackle;
  if (wantsTackle && p.cd <= 0 && p.slide === 0 && !p.gk && !holding) { p.slide = 14; p.cd = 45; }

  if (p.slide > 0) {
    for (const q of g.ps) {
      if (q.side === p.side || q.down > 0 || dist(p, q) > 14) continue;
      q.down = 55; g.ev.push('tackle');
      if (b.owner === q) { b.owner = p; p.hold = 0; b.sup = false; }
    }
  }
  if (holding && p.gk) p.hold++; else if (!holding) p.hold = 0;
}

export function step(g: Game, inp: Input | null) {
  g.frame++; g.ev.length = 0;
  g.msgs = g.msgs.filter((m) => --m.ttl > 0);
  if (g.kick > 0) { if (--g.kick === 0) g.ev.push('whistle'); return; }
  const b = g.ball;
  chooseCtl(g);

  const chaser: Record<number, P | undefined> = {};
  ([0, 1] as Side[]).forEach((s) => {
    const ref = b.owner && b.owner.side !== s ? b.owner : b;
    chaser[s] = field(g, s).filter((q) => q.down === 0 && q !== g.ctl).sort((a, c) => dist(a, ref) - dist(c, ref))[0];
  });
  for (const p of g.ps) {
    const human = p === g.ctl && inp !== null;
    const a: Act = human ? { mx: inp!.dx, my: inp!.dy } : decide(g, p, chaser[p.side]);
    act(g, p, a, human, inp);
  }
  g.prevShoot = !!inp?.shoot;

  // players shove each other apart a little so nobody stacks on one spot
  for (let i = 0; i < g.ps.length; i++) for (let j = i + 1; j < g.ps.length; j++) {
    const a = g.ps[i], c = g.ps[j], d = dist(a, c);
    if (d > 0 && d < 12) { const k = (12 - d) / 2 / d; a.x -= (c.x - a.x) * k; a.y -= (c.y - a.y) * k; c.x += (c.x - a.x) * k; c.y += (c.y - a.y) * k; }
  }

  for (const p of g.ps) { p.x = clamp(p.x, MX, W - MX); p.y = clamp(p.y, MY, H - MY); }

  if (b.owner) {
    const o = b.owner;
    b.x = o.x + o.fx * 9; b.y = o.y + o.fy * 9; b.vx = o.vx; b.vy = o.vy;
    return;
  }

  b.x += b.vx; b.y += b.vy; b.vx *= 0.985; b.vy *= 0.985;
  if (Math.hypot(b.vx, b.vy) < 0.05) { b.vx = b.vy = 0; }
  if (b.sup && Math.hypot(b.vx, b.vy) < 5.5) b.sup = false;
  if (b.noPick > 0) b.noPick--;

  if (b.y < 6) { b.y = 6; b.vy = Math.abs(b.vy) * 0.8; }
  if (b.y > H - 6) { b.y = H - 6; b.vy = -Math.abs(b.vy) * 0.8; }
  if (b.x < 0 || b.x > W) {
    const inMouth = b.y > GY1 && b.y < GY2;
    if (inMouth) return goal(g, b.x < 0 ? 1 : 0);
    b.x = b.x < 0 ? 0 : W; b.vx = -b.vx * 0.8;
  }

  // a special shot flattens whoever it touches (keeper included) and keeps flying
  if (b.sup) {
    for (const q of g.ps) if (q.side !== b.ks && q.down === 0 && dist(q, b) < 13) { q.down = 70; b.vx *= 0.92; b.vy *= 0.92; g.ev.push('tackle'); }
    return;
  }
  let best: P | null = null;
  for (const q of g.ps) {
    if (q.down > 0 || (q === b.noP && b.noPick > 0)) continue;
    const d = dist(q, b);
    if (d < (q.gk ? 16 : 11) && (!best || d < dist(best, b))) best = q;
  }
  if (best) { b.owner = best; best.hold = 0; b.vx = b.vy = 0; if (best.gk) g.ev.push('save'); }
}

function goal(g: Game, scorer: Side) {
  g.score[scorer]++;
  g.ev.push('goal');
  g.msgs.push({ text: scorer === 0 ? 'GOAL!! ⚽' : 'Họ ghi bàn…', ttl: 90, color: scorer === 0 ? '#ffe14d' : '#ff6b6b' });
  const b = g.ball;
  Object.assign(b, { x: W / 2, y: H / 2, vx: 0, vy: 0, owner: null, sup: false, noPick: 0, noP: null });
  for (const p of g.ps) Object.assign(p, { x: p.hx, y: p.hy, vx: 0, vy: 0, down: 0, slide: 0, charge: 0, hold: 0 });
  g.kick = 100;
}

/** Keyboard/touch state -> Input (diagonal movement is normalised in act()). */
export const emptyInput = (): Input => ({ dx: 0, dy: 0, shoot: false, pass: false, tackle: false });
