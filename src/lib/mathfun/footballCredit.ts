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
