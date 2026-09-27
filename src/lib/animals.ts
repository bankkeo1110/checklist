// Animal reward tiers — a kid unlocks the next (bigger, cooler) animal as
// their lifetime earned star count crosses each threshold. Tiers are ordered
// smallest-to-largest and the list is walked linearly, so keep it sorted.
export type AnimalTier = { threshold: number; emoji: string; name: string };

export const ANIMAL_TIERS: AnimalTier[] = [
  { threshold: 5, emoji: "🐛", name: "Sâu bướm" },
  { threshold: 10, emoji: "🐥", name: "Gà con" },
  { threshold: 20, emoji: "🐰", name: "Thỏ" },
  { threshold: 35, emoji: "🐿️", name: "Sóc" },
  { threshold: 50, emoji: "🐱", name: "Mèo" },
  { threshold: 75, emoji: "🐶", name: "Chó" },
  { threshold: 100, emoji: "🦁", name: "Sư tử" },
  { threshold: 150, emoji: "🐻", name: "Gấu" },
  { threshold: 200, emoji: "🦕", name: "Khủng long" },
  { threshold: 300, emoji: "🐉", name: "Rồng" },
  { threshold: 500, emoji: "🦄", name: "Kỳ lân" },
];
