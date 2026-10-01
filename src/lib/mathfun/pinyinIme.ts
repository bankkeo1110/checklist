import { pinyin } from 'pinyin-pro';
import { COMMON_HANZI } from './hanzi';

// Build a reverse map: toneless pinyin syllable -> list of hanzi.
// Characters are ordered by their position in COMMON_HANZI (roughly by
// frequency), so the most common candidates appear first.
const SYLLABLE_MAP: Map<string, string[]> = (() => {
  const map = new Map<string, string[]>();
  for (const ch of COMMON_HANZI) {
    const py = pinyin(ch, { toneType: 'none', type: 'string' }).trim();
    if (!py || !/^[a-z]+$/.test(py)) continue;
    const list = map.get(py) ?? [];
    if (!list.includes(ch)) list.push(ch);
    map.set(py, list);
  }
  return map;
})();

// Valid syllables sorted longest-first for greedy segmentation.
const VALID_SYLLABLES = Array.from(SYLLABLE_MAP.keys()).sort(
  (a, b) => b.length - a.length,
);

/** Split a pinyin buffer greedily into [firstSyllable, rest]. */
export function splitPinyin(buffer: string): { syllable: string; rest: string } {
  const b = buffer.toLowerCase();
  for (const syl of VALID_SYLLABLES) {
    if (b.startsWith(syl)) {
      return { syllable: syl, rest: b.slice(syl.length) };
    }
  }
  // No known syllable prefix: fall back to the whole buffer so the user can
  // still see (empty) candidates and keep typing / backspacing.
  return { syllable: b, rest: '' };
}

/** Candidate hanzi for the leading syllable of the current pinyin buffer. */
export function getCandidates(buffer: string): string[] {
  if (!buffer) return [];
  const { syllable } = splitPinyin(buffer);
  // Exact syllable match first, then any syllable that starts with the buffer
  // (helps while the user is still typing, e.g. "zh" -> zhong, zhi...).
  const exact = SYLLABLE_MAP.get(syllable) ?? [];
  if (exact.length) return exact.slice(0, 20);
  const prefix = buffer.toLowerCase();
  const collected: string[] = [];
  for (const syl of VALID_SYLLABLES) {
    if (syl.startsWith(prefix)) {
      for (const ch of SYLLABLE_MAP.get(syl) ?? []) {
        if (!collected.includes(ch)) collected.push(ch);
      }
    }
    if (collected.length >= 20) break;
  }
  return collected.slice(0, 20);
}

/** Pretty tone-marked pinyin for display, e.g. "你好" -> "nǐ hǎo". */
export function toDisplayPinyin(hanzi: string): string {
  return pinyin(hanzi, { toneType: 'symbol', type: 'string' });
}
