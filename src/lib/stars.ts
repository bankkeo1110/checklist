export const MIN_STARS = 1;
export const MAX_STARS = 5;
export const DEFAULT_STARS = 1;

export function isValidStarCount(value: number): boolean {
  return Number.isInteger(value) && value >= MIN_STARS && value <= MAX_STARS;
}
