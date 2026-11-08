import type { Question } from './questions';

export function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }
export function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
export function pick<T>(arr: T[]): T { return arr[rand(0, arr.length - 1)]; }
export function gcd(a: number, b: number): number { return b === 0 ? Math.abs(a) : gcd(b, a % b); }
export function lcm(a: number, b: number): number { return (a * b) / gcd(a, b); }

export function simplifyFrac(num: number, den: number): string {
  if (num === 0) return '0';
  const g = gcd(Math.abs(num), den);
  return den / g === 1 ? String(num / g) : `${num / g}/${den / g}`;
}

/** numeric choices around a correct value */
export function makeChoices(correct: number, range: number): string[] {
  const r = Math.max(range, 3); // need at least 3 to guarantee 3 unique positives
  const wrong = new Set<number>();
  while (wrong.size < 3) {
    const offset = rand(-r, r);
    const v = correct + offset;
    if (offset !== 0 && v > 0) wrong.add(v);
  }
  return shuffle([correct, ...wrong].map(String));
}

// ─── helpers for the Vietnamese curriculum lessons ───────────────────────────

/** 1234567 -> "1 234 567" (non-breaking space, as in Vietnamese textbooks) */
export const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** Numeric question. `near` = tempting wrong answers (typical mistakes); padded randomly to 3. */
export function numQ(question: string, ans: number, explanation: string, near: number[] = []): Question {
  const wrong = new Set<number>();
  for (const v of shuffle(near)) if (v !== ans && v >= 0) wrong.add(v);
  const r = Math.max(3, Math.round(Math.abs(ans) * 0.1));
  for (let i = 0; wrong.size < 3 && i < 200; i++) {
    const v = ans + rand(-r, r);
    if (v !== ans && v >= 0) wrong.add(v);
  }
  return { question, answer: fmt(ans), choices: shuffle([ans, ...[...wrong].slice(0, 3)].map(fmt)), explanation };
}

/** Text question with explicit distractors (up to 3 kept). */
export function strQ(question: string, ans: string, wrong: string[], explanation: string): Question {
  const w = [...new Set(wrong)].filter((x) => x !== ans);
  return { question, answer: ans, choices: shuffle([ans, ...shuffle(w).slice(0, 3)]), explanation };
}

/** Fraction question: answer is n/d in lowest terms; distractors are value-distinct. */
export function fracQ(question: string, n: number, d: number, explanation: string, near: [number, number][] = []): Question {
  const ans = simplifyFrac(n, d);
  const cand: [number, number][] = [...near, [n + 1, d], [Math.max(1, n - 1), d], [n, d + 1], [n, Math.max(1, d - 1)], [n + d, d], [d, Math.max(1, n)]];
  const wrong = new Set<string>();
  for (const [a, b] of shuffle(cand)) if (b > 0 && a > 0) { const s = simplifyFrac(a, b); if (s !== ans) wrong.add(s); }
  for (let i = 0; wrong.size < 3 && i < 100; i++) { const s = simplifyFrac(rand(1, 12), rand(2, 12)); if (s !== ans) wrong.add(s); }
  return { question, answer: ans, choices: shuffle([ans, ...[...wrong].slice(0, 3)]), explanation };
}

/** Scaled integer -> Vietnamese decimal: dec(1250, 2) = "12,5" (comma, trailing zeros dropped). */
export function dec(scaled: number, p: number): string {
  if (p === 0) return fmt(scaled);
  const [i, f] = (scaled / 10 ** p).toFixed(p).split('.');
  const frac = f.replace(/0+$/, '');
  return fmt(Number(i)) + (frac ? ',' + frac : '');
}

/** Decimal question: every value is an integer scaled by 10^p (avoids float error). */
export function decQ(question: string, ans: number, p: number, explanation: string, near: number[] = []): Question {
  const a = dec(ans, p), wrong = new Set<string>();
  for (const v of shuffle(near)) if (v >= 0 && dec(v, p) !== a) wrong.add(dec(v, p));
  const r = Math.max(3, Math.round(ans * 0.1));
  for (let i = 0; wrong.size < 3 && i < 200; i++) { const v = ans + rand(-r, r); if (v >= 0 && dec(v, p) !== a) wrong.add(dec(v, p)); }
  return { question, answer: a, choices: shuffle([a, ...[...wrong].slice(0, 3)]), explanation };
}

/** Like numQ but every choice carries a % sign. */
export function pctQ(question: string, ans: number, explanation: string, near: number[] = []): Question {
  const q = numQ(question, ans, explanation, near);
  return { ...q, answer: q.answer + '%', choices: q.choices.map((c) => c + '%') };
}

export interface LessonExample { q: string; a: string }

/** One topic of the school-year curriculum: rule (theory) + worked examples + exercise generator. */
export interface Lesson {
  id: string;
  semester: 1 | 2;
  label: string;
  emoji: string;
  color: string;
  description: string;
  /** Theory text; supports `$..$` KaTeX and `\n` line breaks (rendered by MathText). */
  rule: string;
  examples: LessonExample[];
  gen: () => Question;
}
