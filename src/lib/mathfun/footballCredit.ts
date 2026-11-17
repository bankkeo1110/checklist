// Play time earned by finishing a 100-point exercise, spent in the football reward game.
// shortcut: stored in this browser's localStorage (shared by every child on the device, editable by a tech-savvy kid); move to the DB if that matters.
const KEY = "football_credit_sec";
export const PLAY_SECONDS = 5 * 60;

export function getCredit(): number {
  try { return Math.max(0, Number(localStorage.getItem(KEY)) || 0); } catch { return 0; }
}
export function setCredit(sec: number) {
  try { localStorage.setItem(KEY, String(Math.max(0, Math.floor(sec)))); } catch { /* storage blocked */ }
}
export const BONUS_SECONDS = 2 * 60;
/** Default: one finished exercise = 5 minutes. Pass extra seconds for a flawless run. */
export const addCredit = (sec: number = PLAY_SECONDS) => setCredit(getCredit() + sec);

// A topic cleared once already shouldn't keep paying out — otherwise a kid can "Đánh lại" (redo)
// the same already-passed exercise over and over to farm football minutes.
const CLEARED_KEY = 'mathfun_cleared_topics_v1';

function readCleared(): Set<string> {
  try {
    const raw = localStorage.getItem(CLEARED_KEY);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

/** Has this exercise/topic already been cleared before (on this device, or synced from a server badge)? */
export function hasClearedBefore(topic: string): boolean {
  return readCleared().has(topic);
}

/** Record that this topic is now cleared, so a future redo earns no more play time. */
export function markCleared(topic: string) {
  try {
    const s = readCleared();
    if (s.has(topic)) return;
    s.add(topic);
    localStorage.setItem(CLEARED_KEY, JSON.stringify([...s]));
  } catch { /* storage blocked */ }
}
