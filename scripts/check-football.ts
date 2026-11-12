// Headless sanity check for the football sim: `npx tsx scripts/check-football.ts`
// A scripted stand-in for the kid plays full matches against the weakest and the strongest CPU team.
import { newGame, step, emptyInput, W, H, LEVELS, CHARGE_FULL, type Game } from '../src/lib/football/sim';

const unit = (dx: number, dy: number) => { const l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; };

function playMatch(level: number) {
  const g: Game = newGame([0, 1, 2, 3], [4, 5, 6, 7], level);
  const seen = new Set<string>();
  let charge = 0, corner = 1, frames = 0;
  while (g.phase !== 'full') {
    if (++frames > 60 * 60 * 6) throw new Error('match never ended');
    const inp = emptyInput(), b = g.ball, me = g.ctl;
    if (b.owner === me) {
      [inp.dx, inp.dy] = unit(W - me.x, H / 2 - me.y);
      if (W - me.x < 230) { // wind up, then release aiming at a corner
        if (charge < (g.ki[0] >= 100 ? CHARGE_FULL + 2 : 24)) { inp.shoot = true; charge++; } else { charge = 0; corner = -corner; }
        inp.dy = corner;
      }
      inp.sprint = W - me.x > 300;
    } else {
      charge = 0;
      const t = b.owner ?? b;
      [inp.dx, inp.dy] = unit(t.x - me.x, t.y - me.y);
      inp.tackle = !!b.owner && b.owner.side === 1 && Math.hypot(t.x - me.x, t.y - me.y) < 28 && frames % 20 === 0;
    }
    step(g, inp);
    for (const e of g.ev) seen.add(e.t);
    for (const p of g.ps) if (![p.x, p.y, p.vx, p.vy].every(Number.isFinite) || p.x < 0 || p.x > W || p.y < 0 || p.y > H) throw new Error(`player out of bounds at frame ${frames}`);
    if (![b.x, b.y, b.z, b.vx, b.vy].every(Number.isFinite) || b.x < -20 || b.x > W + 20 || b.y < 0 || b.y > H || b.z < 0) throw new Error(`ball out of bounds at frame ${frames}: ${b.x},${b.y},${b.z}`);
    if (g.ki.some((k) => k < 0 || k > 100) || g.stamina < 0 || g.stamina > 100) throw new Error('meter out of range');
  }
  return { score: g.score, seen, frames };
}

const N = 12;
const summary = [0, LEVELS.length - 1].map((level) => {
  let w = 0, d = 0, l = 0, gf = 0, ga = 0;
  const seen = new Set<string>();
  for (let i = 0; i < N; i++) {
    const m = playMatch(level);
    gf += m.score[0]; ga += m.score[1];
    if (m.score[0] > m.score[1]) w++; else if (m.score[0] < m.score[1]) l++; else d++;
    m.seen.forEach((e) => seen.add(e));
  }
  console.log(`${LEVELS[level].name.padEnd(14)} ${N} matches: W${w} D${d} L${l}, goals ${gf}-${ga} (${(gf / N).toFixed(1)} / ${(ga / N).toFixed(1)} per match), events: ${[...seen].sort().join(' ')}`);
  return { w, l, gf, ga, seen };
});

const [easy, hard] = summary;
const need = ['goal', 'kick', 'save', 'super', 'tackle', 'whistle', 'fulltime'];
for (const e of need) if (!easy.seen.has(e) && !hard.seen.has(e)) throw new Error(`event "${e}" never happened`);
if (easy.gf / N < 1.5) throw new Error('the scripted kid barely scores against the easiest team — too hard');
if (easy.w <= easy.l) throw new Error('the easiest team should usually lose');
if (hard.ga <= easy.ga) throw new Error('the strongest team should score more than the weakest');
if (hard.ga / N < 1) throw new Error('the strongest team barely scores — no challenge');
console.log('ok');
