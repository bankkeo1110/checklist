// Simulates practice sessions to keep the pacing honest: `npx tsx scripts/check-practice.ts`
import { LESSONS } from '../src/lib/mathfun/curriculum';
import { generateQuestion } from '../src/lib/mathfun/questions';
import {
  TARGET_POINTS, CHALLENGE_TOPIC, RETRY_AFTER, calcScore, isSessionComplete,
  calcAccuracy, starsForAccuracy, getPointsDelta,
} from '../src/lib/mathfun/practice-logic';

let bad = 0;
const fail = (m: string) => { bad++; console.log('FAIL', m); };

/** One session played by a kid who answers correctly `rate` of the time; mirrors the page's loop. */
function session(rate: number) {
  let points = 0, streak = 0, asked = 0, correct = 0, total = 0;
  const retry: number[] = []; // due indices
  while (!(isSessionComplete(points) && retry.length === 0)) {
    if (++asked > 500) return null; // never finishes
    const dueAt = retry.findIndex((d) => d <= asked);
    if (dueAt >= 0) retry.splice(dueAt, 1);
    const ok = Math.random() < rate;
    points = calcScore(points, streak, ok);
    total++;
    if (ok) { correct++; streak++; } else { streak = 0; retry.push(asked + RETRY_AFTER); }
  }
  return { questions: total, accuracy: calcAccuracy(correct, total) };
}

for (const [label, rate, min, max] of [['perfect', 1, 8, 13], ['good', 0.8, 10, 20], ['struggling', 0.55, 16, 42]] as const) {
  const runs = Array.from({ length: 300 }, () => session(rate));
  if (runs.some((r) => r === null)) { fail(`${label}: some sessions never finish`); continue; }
  const qs = runs.map((r) => r!.questions);
  const avg = qs.reduce((a, b) => a + b, 0) / qs.length;
  console.log(`${label.padEnd(11)} ${(rate * 100).toFixed(0)}% đúng → ${avg.toFixed(1)} câu trung bình (ít nhất ${Math.min(...qs)}, nhiều nhất ${Math.max(...qs)})`);
  if (avg < min || avg > max) fail(`${label}: ${avg.toFixed(1)} questions is outside the ${min}–${max} window`);
}

// A flawless run must never be slower than a sloppy one, and points stay inside the bar.
if (getPointsDelta(0, true) >= getPointsDelta(5, true)) fail('a long streak should hit harder than a fresh one');
if (getPointsDelta(0, false) >= 0) fail('a wrong answer must cost points');
if (calcScore(0, 0, false) !== 0) fail('points must not go negative');
if (calcScore(TARGET_POINTS, 9, true) !== TARGET_POINTS) fail('points must not exceed the target');
if (starsForAccuracy(100) !== 3 || starsForAccuracy(75) !== 2 || starsForAccuracy(40) !== 1) fail('star cut-offs wrong');

// Every lesson, and the mixed challenge, must produce usable questions.
for (const topic of [...LESSONS.map((l) => l.id), CHALLENGE_TOPIC]) {
  for (let i = 0; i < 60; i++) {
    const q = generateQuestion(topic);
    if (!q.question.trim()) fail(`${topic}: empty question`);
    // 4 choices normally; sign questions (< > =) only have 3 possible answers.
    if (q.choices.length < 3 || q.choices.length > 4) fail(`${topic}: ${q.choices.length} choices`);
    if (q.choices.length === 3 && !q.choices.every((c) => '<>='.includes(c))) fail(`${topic}: only 3 choices (${q.choices.join(', ')})`);
    if (new Set(q.choices).size !== q.choices.length) fail(`${topic}: duplicate choices (${q.choices.join(', ')})`);
    if (!q.choices.includes(q.answer)) fail(`${topic}: the answer is not among the choices`);
    if (!q.explanation.trim()) fail(`${topic}: no explanation`);
  }
}

console.log(bad ? `${bad} problem(s)` : 'all ok');
process.exit(bad ? 1 : 0);
