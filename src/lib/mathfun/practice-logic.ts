export const TARGET_POINTS = 100;

export function getPointsDelta(current: number, correct: boolean): number {
  if (current < 30) return correct ? 10 : -10;
  if (current < 60) return correct ? 5 : -5;
  if (current < 80) return correct ? 3 : -3;
  return correct ? 2 : -2;
}

export function calcScore(current: number, correct: boolean): number {
  return Math.max(0, Math.min(TARGET_POINTS, current + getPointsDelta(current, correct)));
}

export function isSessionComplete(points: number): boolean {
  return points >= TARGET_POINTS;
}

export function calcAccuracy(correct: number, total: number): number {
  return total === 0 ? 0 : Math.round((correct / total) * 100);
}
