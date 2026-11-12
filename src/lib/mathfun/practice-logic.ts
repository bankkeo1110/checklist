export const TARGET_POINTS = 100;

/** Pseudo-topic: a mixed quiz drawn from every Toán 5 lesson. */
export const CHALLENGE_TOPIC = 'thu-thach-lop5';

/**
 * Damage dealt by one answer. `streak` = correct answers in a row BEFORE this one.
 * A flawless run beats the guard in 10 questions (8,8,10,10,12…); a slip heals it 3 and resets the
 * combo, so a session stays short enough for one sitting while mistakes still have to be worked off.
 */
export function getPointsDelta(streak: number, correct: boolean): number {
  if (!correct) return -3;
  return streak >= 4 ? 12 : streak >= 2 ? 10 : 8;
}

export function calcScore(current: number, streak: number, correct: boolean): number {
  return Math.max(0, Math.min(TARGET_POINTS, current + getPointsDelta(streak, correct)));
}

export function isSessionComplete(points: number): boolean {
  return points >= TARGET_POINTS;
}

export function calcAccuracy(correct: number, total: number): number {
  return total === 0 ? 0 : Math.round((correct / total) * 100);
}

/** 1–3 stars, on the same accuracy cut-offs as the badges (bronze / silver / gold + perfect). */
export function starsForAccuracy(accuracy: number): 1 | 2 | 3 {
  return accuracy >= 85 ? 3 : accuracy >= 70 ? 2 : 1;
}

export function starsForBadge(badge: string | undefined): 0 | 1 | 2 | 3 {
  return badge === 'perfect' || badge === 'gold' ? 3 : badge === 'silver' ? 2 : badge === 'bronze' ? 1 : 0;
}

/** How many questions later a missed question comes back for a second try. */
export const RETRY_AFTER = 3;
