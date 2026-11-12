// Headless check for the football sim: `npx tsx scripts/check-football.ts`
// Two scripted players (a careful one and a clumsy young one) play full matches so the
// difficulty levels can be checked for real: Dễ has to be winnable, Khó has to bite.
import { newGame, step, emptyInput, supHeight, supOffset, W, H, CHARS, LEVELS, DIFFICULTIES, SUP_KINDS, FIRST_SUP, CHARGE_FULL, type Game } from '../src/lib/football/sim';

interface Skill { name: string; react: number; err: number; charge: number; sprintP: number; idleP: number; corner: boolean }
/** A 10-year-old: reacts a quarter-second late, runs crooked, taps the shoot button. */
const KID: Skill = { name: 'bé', react: 15, err: 0.75, charge: 10, sprintP: 0.2, idleP: 0.2, corner: false };
/** Someone who knows the controls: instant, straight, charges every shot and picks a corner. */
const PRO: Skill = { name: 'giỏi', react: 1, err: 0.03, charge: 44, sprintP: 0.9, idleP: 0, corner: true };

const kinds = new Set<string>();
/** The opening special of every match, per side, and everything fired after it. */
const firstSup: [string[], string[]] = [[], []];
const laterSups = new Set<string>();

function playMatch(level: number, difficulty: number, skill: Skill) {
  const g: Game = newGame([0, 1, 2, 3], [4, 5, 6, 7], level, difficulty);
  const seen = new Set<string>();
  let dx = 0, dy = 0, idle = false, hold = 0, frames = 0, corner = 1;
  const fired: [number, number] = [0, 0];
  while (g.phase !== 'full') {
    if (++frames > 60 * 60 * 6) throw new Error('match never ended');
    const inp = emptyInput(), b = g.ball, me = g.ctl, mine = b.owner === me;
    if (frames % skill.react === 0) {
      const t = mine ? { x: W, y: H / 2 } : (b.owner ?? b);
      const a = Math.atan2(t.y - me.y, t.x - me.x) + (Math.random() * 2 - 1) * skill.err;
      dx = Math.cos(a); dy = Math.sin(a);
      idle = Math.random() < skill.idleP;
    }
    if (mine) {
      inp.sprint = Math.random() < skill.sprintP;
      if (W - me.x < 240) {
        if (skill.corner) { dx = 1; dy = corner; }  // a good player shoots at a corner, not at the keeper
        hold++;
        const want = g.ki[0] >= 100 ? CHARGE_FULL + 4 : skill.charge; // full ki: hold for the special
        if (hold <= want) inp.shoot = true; else if (hold > want + 2) { hold = 0; corner = -corner; }
      } else hold = 0;
    } else {
      hold = 0;
      inp.tackle = !!b.owner && b.owner.side === 1 && Math.hypot(b.x - me.x, b.y - me.y) < 28 && frames % 40 === 0;
    }
    if (!idle) { inp.dx = dx; inp.dy = dy; }
    step(g, inp);
    for (const e of g.ev) {
      seen.add(e.t);
      if (!e.kind) continue;
      kinds.add(e.kind);
      const side = e.side ?? 0;
      if (fired[side]++ === 0) firstSup[side].push(e.kind); else laterSups.add(e.kind);
    }
    for (const p of g.ps) if (![p.x, p.y, p.vx, p.vy].every(Number.isFinite) || p.x < 0 || p.x > W || p.y < 0 || p.y > H) throw new Error(`player out of bounds at frame ${frames}`);
    if (![b.x, b.y, b.z, b.vx, b.vy].every(Number.isFinite) || b.x < -20 || b.x > W + 20 || b.y < 0 || b.y > H || b.z < 0) throw new Error(`ball out of bounds at frame ${frames}: ${b.x},${b.y},${b.z}`);
    if (g.ki.some((k) => k < 0 || k > 100) || g.stamina < 0 || g.stamina > 100) throw new Error('meter out of range');
  }
  return { score: g.score, seen };
}

const N = 14;
/** The boss fight swings a lot match to match, so it is measured over more of them. */
const N_BOSS = 50;
function run(label: string, level: number, difficulty: number, skill: Skill, n = N) {
  let w = 0, d = 0, l = 0, gf = 0, ga = 0;
  const seen = new Set<string>();
  for (let i = 0; i < n; i++) {
    const m = playMatch(level, difficulty, skill);
    gf += m.score[0]; ga += m.score[1];
    if (m.score[0] > m.score[1]) w++; else if (m.score[0] < m.score[1]) l++; else d++;
    m.seen.forEach((e) => seen.add(e));
  }
  console.log(`${label.padEnd(30)} ${n} trận: T${w} H${d} B${l} · bàn ${gf}-${ga} (${(gf / n).toFixed(1)} / ${(ga / n).toFixed(1)} mỗi trận)`);
  return { w, d, l, gf, ga, n, winRate: w / n, seen };
}

let bad = 0;
const fail = (m: string) => { bad++; console.log('FAIL', m); };

// The default experience: a child, easiest setting, first team on the ladder.
const kidEasy = run(`${DIFFICULTIES[0].name} · ${LEVELS[0].name} · bé`, 0, 0, KID, 30);
// Same child, same opponent, all three settings — a controlled comparison.
const kidD = run(`${DIFFICULTIES[0].name} · ${LEVELS[1].name} · bé`, 1, 0, KID);
const kidV = run(`${DIFFICULTIES[1].name} · ${LEVELS[1].name} · bé`, 1, 1, KID);
const kidK = run(`${DIFFICULTIES[2].name} · ${LEVELS[1].name} · bé`, 1, 2, KID);
// The boss fight: best team, hardest setting, played well.
const proBoss = run(`${DIFFICULTIES[2].name} · ${LEVELS[4].name} · giỏi`, 4, 2, PRO, N_BOSS);

const diff = (r: { gf: number; ga: number; n: number }) => (r.gf - r.ga) / r.n;

// A child on the default setting wins comfortably, scores plenty and is not buried…
if (kidEasy.winRate < 0.8) fail(`Dễ: a kid wins only ${(kidEasy.winRate * 100).toFixed(0)}% of matches — still too hard`);
if (kidEasy.gf / kidEasy.n < 2) fail(`Dễ: a kid scores ${(kidEasy.gf / kidEasy.n).toFixed(1)} goals a match — not rewarding enough`);
if (kidEasy.ga / kidEasy.n > 1.2) fail(`Dễ: a kid concedes ${(kidEasy.ga / kidEasy.n).toFixed(1)} a match — too punishing`);
if (kidEasy.gf / kidEasy.n > 11) fail(`Dễ: ${(kidEasy.gf / kidEasy.n).toFixed(1)} goals a match is a walkover, not a game`);
// …and against one and the same opponent each step up has to bite.
if (diff(kidD) <= diff(kidV)) fail('Vừa is not harder than Dễ');
if (diff(kidV) <= diff(kidK)) fail('Khó is not harder than Vừa');
if (kidK.winRate >= kidD.winRate) fail('a kid should win less often on Khó than on Dễ');
// The last team on Khó is a boss: an even fight for someone who plays well, decided by a goal or two.
if (Math.abs(diff(proBoss)) > 1.5) fail(`Khó: the final team ends ${diff(proBoss).toFixed(1)} goals apart on average — not an even fight`);
if (proBoss.winRate < 0.2) fail(`Khó: the final team is won ${(proBoss.winRate * 100).toFixed(0)}% of the time even played well`);
if (proBoss.winRate > 0.8) fail('Khó: the final team is no challenge');

// Your first pick leads the line and is the one you start controlling; the keeper is someone else.
{
  const mine = [2, 5, 0, 7];
  const g = newGame(mine, [1, 3, 4, 6], 0, 0);
  const striker = g.ps.find((p) => p.side === 0 && p.role === 4)!;
  const keeper = g.ps.find((p) => p.side === 0 && p.gk)!;
  if (striker.ch !== mine[0]) fail(`the first pick should be the striker, got ${CHARS[striker.ch].name}`);
  if (g.ctl !== striker) fail('the kick-off should hand you the striker');
  if (mine.includes(keeper.ch)) fail(`${CHARS[keeper.ch].name} is both keeper and outfielder`);
  const outfield = g.ps.filter((p) => p.side === 0 && !p.gk).map((p) => p.ch).sort();
  if (outfield.join() !== [...mine].sort().join()) fail('the four picks must each take one outfield spot');
}

// Whoever takes it, the first special of the match is the beam; the rest are drawn from the others.
for (const side of [0, 1] as const) {
  const firsts = new Set(firstSup[side]);
  if (firsts.size !== 1 || !firsts.has(FIRST_SUP)) fail(`side ${side} opened with ${[...firsts].join('/')} instead of ${FIRST_SUP}`);
}
if (laterSups.has(FIRST_SUP)) fail(`${FIRST_SUP} should not come round again after the opening special`);
if (laterSups.size < SUP_KINDS.length - 2) fail(`only ${laterSups.size} different specials followed the opening one`);

// Every special has to stay on the pitch.
for (const k of SUP_KINDS) {
  for (let i = 0; i <= 20; i++) {
    const t = i / 20, off = supOffset(k, t), z = supHeight(k, t);
    if (!Number.isFinite(off) || Math.abs(off) > 110) fail(`${k}: swings ${off.toFixed(0)}px sideways — off the pitch`);
    if (!Number.isFinite(z) || z < 0 || z > 130) fail(`${k}: flies at height ${z.toFixed(0)}`);
  }
  if (Math.abs(supOffset(k, 0)) > 0.01 || Math.abs(supOffset(k, 1)) > 0.01) fail(`${k}: must leave the foot and reach the goal on the aim line`);
}
if (kinds.size < SUP_KINDS.length - 1) fail(`only ${kinds.size} of ${SUP_KINDS.length} specials were ever fired in the test matches`);
console.log(`tuyệt chiêu đã bắn trong lúc test: ${[...kinds].sort().join(', ')}`);

const need = ['goal', 'kick', 'save', 'super', 'tackle', 'whistle', 'fulltime'];
const allSeen = new Set([...kidEasy.seen, ...kidD.seen, ...kidV.seen, ...kidK.seen, ...proBoss.seen]);
for (const e of need) if (!allSeen.has(e)) fail(`event "${e}" never happened`);

console.log(bad ? `${bad} problem(s)` : 'ok');
process.exit(bad ? 1 : 0);
