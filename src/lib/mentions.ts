// @mentions for chat: no rich-text editor, just plain "@Handle" text matched
// against the small, fixed set of family members — so parsing is exact
// substring search rather than a tokenizer. Used both server-side (to decide
// who gets flagged/notified) and client-side (autocomplete + highlighting),
// so this file must stay free of server-only imports (no prisma).

export type MentionCandidate = { kind: "CHILD" | "PARENT"; id: string; label: string };

export const EVERYONE_KEY = "everyone";
export const EVERYONE_LABEL = "Tất cả";

export function mentionKey(person: Pick<MentionCandidate, "kind" | "id">): string {
  return `${person.kind}:${person.id}`;
}

/** "Ba (Tính)" -> "Ba" — the part before a parenthetical, so mentions stay one word. */
export function mentionHandle(label: string): string {
  const idx = label.indexOf(" (");
  return idx >= 0 ? label.slice(0, idx) : label;
}

type MentionTarget = { key: string; handle: string };

function mentionTargets(candidates: MentionCandidate[]): MentionTarget[] {
  return [
    { key: EVERYONE_KEY, handle: EVERYONE_LABEL },
    ...candidates.map((p) => ({ key: mentionKey(p), handle: mentionHandle(p.label) })),
  ].sort((a, b) => b.handle.length - a.handle.length); // longest handle first so "Ba" doesn't shadow a longer handle sharing its prefix
}

const WORD_CHAR = /[\p{L}\p{N}_]/u;

function isBoundary(ch: string | undefined): boolean {
  return ch === undefined || !WORD_CHAR.test(ch);
}

function findMentionRanges(body: string, candidates: MentionCandidate[]) {
  const targets = mentionTargets(candidates);
  const ranges: { start: number; end: number; key: string }[] = [];
  for (const t of targets) {
    const needle = `@${t.handle}`;
    let from = 0;
    for (;;) {
      const idx = body.indexOf(needle, from);
      if (idx === -1) break;
      const end = idx + needle.length;
      if (isBoundary(body[idx - 1]) && isBoundary(body[end])) ranges.push({ start: idx, end, key: t.key });
      from = end;
    }
  }
  ranges.sort((a, b) => a.start - b.start);
  const merged: typeof ranges = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r.start < last.end) continue; // first match wins on overlap
    merged.push(r);
  }
  return merged;
}

export function parseMentions(body: string, candidates: MentionCandidate[]): { mentionsEveryone: boolean; mentionedKeys: string[] } {
  const ranges = findMentionRanges(body, candidates);
  const mentionedKeys = new Set<string>();
  let mentionsEveryone = false;
  for (const r of ranges) {
    if (r.key === EVERYONE_KEY) mentionsEveryone = true;
    else mentionedKeys.add(r.key);
  }
  return { mentionsEveryone, mentionedKeys: [...mentionedKeys] };
}

/** Splits body into plain/mention segments for rendering (highlighting @mentions). */
export function splitMentions(body: string, candidates: MentionCandidate[]): { text: string; mention: boolean }[] {
  const ranges = findMentionRanges(body, candidates);
  if (ranges.length === 0) return [{ text: body, mention: false }];
  const segments: { text: string; mention: boolean }[] = [];
  let cursor = 0;
  for (const r of ranges) {
    if (r.start > cursor) segments.push({ text: body.slice(cursor, r.start), mention: false });
    segments.push({ text: body.slice(r.start, r.end), mention: true });
    cursor = r.end;
  }
  if (cursor < body.length) segments.push({ text: body.slice(cursor), mention: false });
  return segments;
}
