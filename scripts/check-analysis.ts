// Headless check for dạng toán labels, tư duy problems and the analysis report:
// `npx tsx scripts/check-analysis.ts`
import { LESSONS } from '../src/lib/mathfun/curriculum';
import { TU_DUY, THINK_SHARE } from '../src/lib/mathfun/curriculum-tuduy';
import { KINDS } from '../src/lib/mathfun/kinds';
import { analyse, toMarkdown, type AnswerRow } from '../src/lib/mathfun/analysis';
import { tallyByKind } from '../src/lib/mathfun/practice-logic';

let bad = 0;
const fail = (m: string) => { bad++; console.log('FAIL', m); };

// 1. Every question carries a real dạng; labels are unique across the curriculum.
const labels = [...Object.values(KINDS).flat(), ...Object.values(TU_DUY).flat().map(([k]) => k)];
if (new Set(labels).size !== labels.length) fail('two templates share a dạng label');
for (const l of LESSONS) {
  let think = 0;
  for (let i = 0; i < 2000; i++) {
    const q = l.gen();
    if (!q.kind || q.kind.includes('#')) { fail(`${l.id}: question without a dạng label (${q.kind})`); break; }
    if (q.kind.startsWith('Tư duy')) think++;
  }
  const share = think / 2000;
  if (!TU_DUY[l.id]?.length) fail(`${l.id}: no tư duy problems`);
  else if (Math.abs(share - THINK_SHARE) > 0.06) fail(`${l.id}: ${(share * 100).toFixed(0)}% tư duy, expected ~${THINK_SHARE * 100}%`);
}

// 2. Tư duy problems: answer offered, 4 distinct choices, no junk, explained in steps.
for (const [id, list] of Object.entries(TU_DUY)) {
  if (list.length < 2) fail(`${id}: fewer than 2 tư duy problems`);
  for (const [kind, gen] of list) {
    for (let i = 0; i < 1500; i++) {
      const q = gen(), all = [q.question, q.answer, ...q.choices, q.explanation].join(' ');
      const why = !q.choices.includes(q.answer) ? 'answer not in choices'
        : new Set(q.choices).size !== 4 ? `${q.choices.length} choices / duplicates`
          : /NaN|undefined|Infinity/.test(all) ? 'junk in text'
            : /(^|\s)-\d/.test([q.answer, ...q.choices].join(' ')) ? 'negative choice'
              : !q.explanation.includes('Bước 2') ? 'not explained step by step' : '';
      if (why) { fail(`${kind}: ${why} — ${q.question} → ${q.answer} [${q.choices.join(' | ')}]`); break; }
    }
  }
}

// 3. Analysis: tallies, strengths / weaknesses and the Claude report.
const row = (kind: string | null, ok: boolean, topic = 'hk1-on-tap-phan-so', retry = false): AnswerRow =>
  ({ topic, kind, question: `${kind} câu hỏi`, correctAnswer: '5', studentAnswer: ok ? '5' : '7', isCorrect: ok, isRetry: retry, answeredAt: new Date().toISOString() });
const rows: AnswerRow[] = [
  ...Array.from({ length: 6 }, (_, i) => row('Cộng, trừ phân số khác mẫu', i < 6)),
  ...Array.from({ length: 5 }, (_, i) => row('Tư duy: phân số của phần còn lại', i < 1)),
  row('Tư duy: phân số của phần còn lại', true, 'hk1-on-tap-phan-so', true),
  ...Array.from({ length: 2 }, () => row('Nhân, chia phân số', false)),
  row(null, false, 'hk1-chia-stp'),
];
const a = analyse(rows, [{ topic: 'hk1-on-tap-phan-so', correct: 8, total: 14, finishedAt: new Date() }]);
if (a.answered !== 15 || a.correct !== 8) fail(`totals ${a.correct}/${a.answered}, expected 8/15`);
if (a.thinking.total !== 6 || a.thinking.correct !== 2) fail('tư duy tally wrong');
if (a.retries.total !== 1 || a.retries.correct !== 1) fail('retry tally wrong');
if (a.weak[0]?.kind !== 'Tư duy: phân số của phần còn lại') fail('weakest dạng should be the tư duy one');
if (a.weak.some((k) => k.kind === 'Nhân, chia phân số')) fail('2 answers are too few to call a weakness');
if (a.strong[0]?.kind !== 'Cộng, trừ phân số khác mẫu') fail('strongest dạng wrong');
if (!a.byKind.some((k) => k.kind === 'Chưa phân dạng · Chia số thập phân')) fail('rows without a dạng should group per lesson');
const md = toMarkdown('Bin', '30 ngày gần nhất', a);
for (const must of ['## Yêu cầu dành cho Claude', 'Kế hoạch 2 tuần', '| Tư duy: phân số của phần còn lại |', 'Bé chọn: **7**', 'Đúng/Tổng'])
  if (!md.includes(must)) fail(`report is missing "${must}"`);
const t = tallyByKind([{ kind: 'A', question: '', answer: '', chosen: '', correct: true, retry: false }, { kind: 'B', question: '', answer: '', chosen: '', correct: false, retry: false }]);
if (t[0].kind !== 'B') fail('session tally should list the most-missed dạng first');

console.log(`${labels.length} dạng toán (${Object.values(TU_DUY).flat().length} tư duy) · ${LESSONS.length} lessons`);
console.log(bad ? `${bad} problem(s)` : 'all ok');
