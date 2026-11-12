// Headless check for the maths race: `npx tsx scripts/check-race.ts`
// A scripted child drives each stage so the pacing, the rewards and the rival stay honest.
import { LESSONS } from '../src/lib/mathfun/curriculum';
import { ISLANDS } from '../src/lib/mathfun/islands';
import { generateQuestion } from '../src/lib/mathfun/questions';
import { CARS, carById } from '../src/lib/race/cars';
import { POWERS, STREAK_FOR_POWER, THEMES, TRACK, answer, drain, newRace, stars, step, type PowerId } from '../src/lib/race/sim';

let bad = 0;
const fail = (m: string) => { bad++; console.log('FAIL', m); };

/** Plays one race answering `rate` of the questions right, roughly one every `every` frames. */
function race(rate: number, every = 100) {
  const r = newRace(LESSONS[0].id, 1);
  const powers = new Set<PowerId>();
  let frames = 0, grants = 0;
  const streakAtGrant: number[] = [];
  while (r.phase === 'run') {
    if (++frames > 60 * 60 * 5) throw new Error('the race never finishes');
    if (frames % every === 0) answer(r, Math.random() < rate);
    step(r);
    for (const e of drain(r)) if (e.t === 'power' && e.power) { powers.add(e.power.id); grants++; streakAtGrant.push(r.streak); }
    if (!Number.isFinite(r.x) || r.x < 0 || r.v < 0 || r.fly < -0.01 || r.fly > 1.01) throw new Error(`car off the rails at frame ${frames}`);
  }
  return { r, frames, powers, grants, streakAtGrant };
}

// Three ways a child plays: careful, slow but careful, and fast but careless.
const seen = new Set<PowerId>();
const profile = (label: string, rate: number, every: number) => {
  let wins = 0, qs = 0;
  for (let i = 0; i < 40; i++) {
    const m = race(rate, every);
    if (m.r.won) wins++;
    qs += m.r.correct + m.r.wrong;
    m.powers.forEach((p) => seen.add(p));
    for (const s of m.streakAtGrant) if (s % STREAK_FOR_POWER !== 0) fail(`a power-up was handed out on a streak of ${s}`);
  }
  console.log(`${label.padEnd(26)} thắng ${wins}/40 · ${(qs / 40).toFixed(0)} câu mỗi chặng`);
  return wins / 40;
};
const careful = profile('đúng 92%, 1,7s mỗi câu', 0.92, 100);
const slowButRight = profile('đúng 90%, 4s mỗi câu', 0.9, 240);
const verySlow = profile('đúng 90%, 6s mỗi câu', 0.9, 360);
const fastButSloppy = profile('đúng 45%, 1,5s mỗi câu', 0.45, 90);

if (careful < 0.85) fail(`answering well wins only ${(careful * 100).toFixed(0)}% of races`);
if (slowButRight < 0.75) fail(`a slow but accurate child wins only ${(slowButRight * 100).toFixed(0)}% — the rival is too quick`);
if (verySlow < 0.6) fail(`a child who needs six seconds a question wins only ${(verySlow * 100).toFixed(0)}% — reading speed matters more than maths`);
if (fastButSloppy > 0.3) fail(`guessing fast still wins ${(fastButSloppy * 100).toFixed(0)}% of races`);

// Every power-up has to be reachable, and each one has to do something.
const long = Array.from({ length: 12 }, () => race(1, 60));
long.forEach((l) => l.powers.forEach((p) => seen.add(p)));
console.log(`bảo bối đã nhận: ${[...seen].sort().join(', ')}`);
if (seen.size < POWERS.length) fail(`only ${seen.size} of ${POWERS.length} power-ups ever appeared`);
if (new Set(POWERS.map((p) => p.id)).size !== POWERS.length) fail('two power-ups share an id');
for (const p of POWERS) {
  if (p.dur < 60) fail(`${p.id} is over too fast to notice`);
  if (p.speed < 1.6) fail(`${p.id} is a dud reward at ${p.speed}× speed`);
  if (!p.name.trim() || !p.blurb.trim() || !p.emoji.trim()) fail(`${p.id} is missing its label`);
}

// One stage per lesson, each with scenery, and every stage must produce questions.
if (THEMES.length !== ISLANDS.length) fail('every island needs its own scenery');
for (const l of LESSONS) {
  const isl = ISLANDS.find((i) => i.lessonIds.includes(l.id));
  if (!isl) { fail(`${l.id} is on no island, so the race has no scenery for it`); continue; }
  const r = newRace(l.id, isl.n);
  if (!r.theme) fail(`${l.id}: no theme`);
  const q = generateQuestion(l.id);
  if (!q.choices.includes(q.answer)) fail(`${l.id}: question has no right answer`);
}

// The garage: distinct vehicles, each a kind of its own, and an unknown id falls back to the first.
if (CARS.length < 8) fail('the garage is thin');
if (new Set(CARS.map((c) => c.id)).size !== CARS.length || new Set(CARS.map((c) => c.kind)).size !== CARS.length) fail('two cars share an id or a shape');
if (new Set(CARS.map((c) => c.name)).size !== CARS.length) fail('two cars share a name');
for (const c of CARS) if (!/^#[0-9a-f]{6}$/i.test(c.color) || !/^#[0-9a-f]{6}$/i.test(c.accent)) fail(`${c.id}: colours must be #rrggbb for the shader`);
if (carById('nope') !== CARS[0] || carById(null) !== CARS[0] || carById(CARS[3].id) !== CARS[3]) fail('carById lookup is wrong');

// Stars reward winning and accuracy.
{
  const r = newRace(LESSONS[0].id, 1);
  r.won = true; r.correct = 20; r.wrong = 0;
  if (stars(r) !== 3) fail('a clean win should be 3 stars');
  r.correct = 10; r.wrong = 6;
  if (stars(r) !== 2) fail('a scrappy win should be 2 stars');
  r.won = false; r.correct = 4; r.wrong = 10;
  if (stars(r) !== 1) fail('a poor loss should be 1 star');
}

const sample = race(0.92);
console.log(`một chặng ${TRACK} đơn vị: ${(sample.frames / 60).toFixed(0)} giây, ${sample.r.correct + sample.r.wrong} câu hỏi, ${sample.r.coins} sao`);
if (sample.frames / 60 > 120) fail('a stage drags on too long for a child');
if (sample.frames / 60 < 25) fail('a stage is over before it starts');

console.log(bad ? `${bad} problem(s)` : 'ok');
process.exit(bad ? 1 : 0);
