// Dragon Ball-themed avatar tiers — same "earn stars, tap to unlock" idea as
// the animal collection, but the highest opened tier also becomes the
// child's avatar (Header, login screen). No official artwork (copyright) —
// represented with emoji + the form/character name instead.
export type DragonBallTier = { threshold: number; emoji: string; name: string };

export const DRAGON_BALL_TIERS: DragonBallTier[] = [
  { threshold: 5, emoji: "👶", name: "Bé Goku" },
  { threshold: 15, emoji: "🥋", name: "Goku" },
  { threshold: 30, emoji: "👊", name: "Goku Kamehameha" },
  { threshold: 50, emoji: "⚡", name: "Super Saiyan" },
  { threshold: 80, emoji: "🔥", name: "Super Saiyan 2" },
  { threshold: 120, emoji: "🌪️", name: "Super Saiyan 3" },
  { threshold: 180, emoji: "💫", name: "Super Saiyan God" },
  { threshold: 250, emoji: "🔵", name: "Super Saiyan Blue" },
  { threshold: 350, emoji: "✨", name: "Ultra Instinct" },
  { threshold: 500, emoji: "🐉", name: "Thần Rồng Shenron" },
];

// The avatar shown in Header/login = the highest tier the child has actually
// opened (not just earned enough for) — same "opened stays opened" model as
// AnimalUnlock records.
export function getOpenedDragonBallTier(openedThresholds: number[]): DragonBallTier | null {
  const openedSet = new Set(openedThresholds);
  const opened = DRAGON_BALL_TIERS.filter((t) => openedSet.has(t.threshold));
  return opened.length ? opened[opened.length - 1] : null;
}
