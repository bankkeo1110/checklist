export const TARGET_POINTS = 100;

/** Pseudo-topic: a mixed quiz drawn from every Toán 5 lesson. */
export const CHALLENGE_TOPIC = 'thu-thach-lop5';

/**
 * Damage dealt by one answer. `streak` = correct answers in a row BEFORE this one.
 * 6 HP, then 8 from the 3rd answer in a row, then 10 (the cap) from the 5th — a flawless run beats
 * the guard in 12 questions (6,6,8,8,10,10…). A slip heals it 3 and resets the combo.
 */
export const MAX_HIT = 10;
export function getPointsDelta(streak: number, correct: boolean): number {
  if (!correct) return -3;
  return streak >= 4 ? MAX_HIT : streak >= 2 ? 8 : 6;
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

/**
 * Football minutes for a first clear, by how many answers were wrong along the way:
 * 0 → 7, 1–3 → 5, 4–5 → 4, 6–7 → 3, 8 or more → 2.
 */
export function rewardMinutes(wrong: number): number {
  return wrong <= 0 ? 7 : wrong <= 3 ? 5 : wrong <= 5 ? 4 : wrong <= 7 ? 3 : 2;
}

/** Extra minutes for beating the mixed challenge, which only opens once all 7 islands are done. */
export const CHALLENGE_BONUS_MIN = 3;

/** How many questions later a missed question comes back for a second try. */
export const RETRY_AFTER = 3;
