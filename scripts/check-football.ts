// Headless sanity check for the football sim: `npx tsx scripts/check-football.ts`
import { newGame, step, emptyInput, W, H } from '../src/lib/football/sim';

const g = newGame([0, 1, 2], [3, 4, 5]);
let supers = 0, tackles = 0;
for (let f = 0; f < 60 * 60 * 10; f++) { // 10 simulated minutes
  const inp = emptyInput(), t = g.ball.owner ?? g.ball;
  inp.dx = t.x - g.ctl.x; inp.dy = t.y - g.ctl.y;
  // stand-in for a human: carry the ball right, shoot when close, tackle when near a carrier
  if (g.ball.owner === g.ctl) { inp.dx = W - g.ctl.x; inp.dy = H / 2 - g.ctl.y; inp.shoot = g.ctl.x < 470 ? true : (f % 90 < 50); }
  inp.tackle = !!g.ball.owner && g.ball.owner.side === 1;
  step(g, inp);
  supers += g.ev.filter((e) => e === 'super').length;
  tackles += g.ev.filter((e) => e === 'tackle').length;
  for (const p of g.ps) if (![p.x, p.y].every(Number.isFinite) || p.x < 0 || p.x > W || p.y < 0 || p.y > H) throw new Error(`player out of bounds at frame ${f}`);
  const b = g.ball;
  if (![b.x, b.y, b.vx, b.vy].every(Number.isFinite) || b.x < -1 || b.x > W + 1 || b.y < 0 || b.y > H) throw new Error(`ball out of bounds at frame ${f}: ${b.x},${b.y}`);
}
console.log(`score ${g.score.join(' - ')}, special shots ${supers}, tackles ${tackles}`);
if (g.score[0] + g.score[1] < 3) throw new Error('almost no goals in 10 minutes — game is stuck');
if (!supers || !tackles) throw new Error('no special shots / tackles happened');
console.log('ok');
