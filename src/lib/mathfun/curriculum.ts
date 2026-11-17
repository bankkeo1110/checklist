import { LESSONS_HK1 } from './curriculum-hk1';
import { LESSONS_HK2 } from './curriculum-hk2';
import { THINK_SHARE, TU_DUY } from './curriculum-tuduy';
import { pick, type Lesson } from './qutil';

/** Every lesson mixes in its tư duy (multi-step reading) problems for about THINK_SHARE of questions. */
export const LESSONS: Lesson[] = [...LESSONS_HK1, ...LESSONS_HK2].map((l) => {
  const think = TU_DUY[l.id];
  if (!think?.length) return l;
  return {
    ...l,
    gen: () => {
      if (Math.random() >= THINK_SHARE) return l.gen();
      const [kind, gen] = pick(think);
      return { ...gen(), kind };
    },
  };
});
