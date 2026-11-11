// Every curriculum lesson must sit on exactly one island: `npx tsx scripts/check-islands.ts`
import { LESSONS } from '../src/lib/mathfun/curriculum';
import { ISLANDS, MAP_W, MAP_H, islandProgress, currentIslandNumber } from '../src/lib/mathfun/islands';

let bad = 0;
const fail = (m: string) => { bad++; console.log('FAIL', m); };

const owner = new Map<string, number>();
for (const i of ISLANDS) {
  if (!i.lessonIds.length) fail(`island ${i.n} has no lessons`);
  if (i.x < 0 || i.x > MAP_W || i.y < 0 || i.y > MAP_H) fail(`island ${i.n} outside the map`);
  for (const id of i.lessonIds) {
    if (owner.has(id)) fail(`${id} is on islands ${owner.get(id)} and ${i.n}`);
    owner.set(id, i.n);
  }
}
for (const l of LESSONS) if (!owner.has(l.id)) fail(`lesson ${l.id} is not on any island`);
for (const id of owner.keys()) if (!LESSONS.some((l) => l.id === id)) fail(`island references unknown lesson ${id}`);
if (ISLANDS.map((i) => i.n).join() !== '1,2,3,4,5,6,7') fail('islands must be numbered 1..7 in order');

// progress logic
const all = LESSONS.map((l) => ({ topic: l.id, badge: 'gold', bestScore: 100, attempts: 1 }));
if (currentIslandNumber([]) !== 1) fail('fresh student should be on island 1');
if (currentIslandNumber(all) !== 7) fail('finished student should be on island 7');
const first = ISLANDS[0].lessonIds.map((id) => ({ topic: id, badge: 'bronze', bestScore: 70, attempts: 1 }));
if (currentIslandNumber(first) !== 2) fail('after island 1 the next island is 2');
const p = islandProgress(ISLANDS[1], [{ topic: ISLANDS[1].lessonIds[0], badge: 'gold', bestScore: 100, attempts: 1 }]);
if (p.done !== 1 || p.total !== 6 || p.complete || !p.started) fail('partial progress wrong');

console.log(`${LESSONS.length} lessons across ${ISLANDS.length} islands`);
console.log(bad ? `${bad} problem(s)` : 'all ok');
process.exit(bad ? 1 : 0);
