// Sanity check for the curriculum generators: `npx tsx scripts/check-curriculum.ts`
import { LESSONS } from '../src/lib/mathfun/curriculum';

let bad = 0;
for (const l of LESSONS) {
  const seen = new Set<string>();
  for (let i = 0; i < 1500; i++) {
    let q;
    try { q = l.gen(); } catch (e) { bad++; console.log(`${l.id}: THROW ${(e as Error).message}`); break; }
    seen.add(q.question);
    const text = `${q.question} ${q.answer} ${q.choices.join('|')} ${q.explanation}`;
    const problems: string[] = [];
    if (!q.choices.includes(q.answer)) problems.push('answer missing from choices');
    if (new Set(q.choices).size !== q.choices.length) problems.push('duplicate choices');
    if (q.choices.length < 2) problems.push(`only ${q.choices.length} choices`);
    if (/NaN|undefined|Infinity|null|-\d/.test(text.replace(/\d-\d/g, ''))) problems.push('bad token');
    if (problems.length) { bad++; console.log(`${l.id}: ${problems.join(', ')}\n  ${q.question}\n  ans=${q.answer} choices=${q.choices.join(' | ')}`); break; }
  }
  console.log(`${l.id.padEnd(28)} distinct questions in 1500 draws: ${seen.size}`);
  if (seen.size < 50) { bad++; console.log('  ^ FEWER THAN 50 DISTINCT'); }
}
console.log(bad ? `\n${bad} problem(s)` : '\nall ok');
process.exit(bad ? 1 : 0);
