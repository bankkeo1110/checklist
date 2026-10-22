import { prisma } from "./prisma";

export type GameId = "typing" | "units" | "mathrace";

export type GameDef = {
  id: GameId;
  href: string;
  emoji: string;
  title: string;
  blurb: string;
  accent: string;
};

// Single source of truth for the reward-games menu — both the child-facing
// page and the parent show/hide manager read from this list, so a new game
// only has to be added here once.
export const GAMES: GameDef[] = [
  {
    id: "typing",
    href: "/child/games/typing",
    emoji: "⌨️",
    title: "Typing Race",
    blurb: "Type English words and sentences fast and correctly.",
    accent: "bg-blue-tint text-blue-text",
  },
  {
    id: "units",
    href: "/child/games/units",
    emoji: "🧪",
    title: "Unit Lab",
    blurb: "Brew the right potion by converting m, cm, km, m², ha, kg, g, l and ml — beat the clock, keep your lives!",
    accent: "bg-green-tint text-green-text",
  },
  {
    id: "mathrace",
    href: "/child/games/mathrace",
    emoji: "⛰️",
    title: "Math Hill Climb",
    blurb: "Gas and brake over the hills, grab coins, and answer fractions/decimals pit stops to refuel and boost!",
    accent: "bg-purple-tint text-purple-text",
  },
];

// A game with no GameConfig row defaults to visible — a row only gets
// created the first time a parent flips it off, so a fresh deploy shows
// every game without needing a seed.
export async function getGameVisibility(): Promise<Record<GameId, boolean>> {
  const rows = await prisma.gameConfig.findMany();
  const byId = new Map(rows.map((r) => [r.id, r.active]));
  const visibility = {} as Record<GameId, boolean>;
  for (const game of GAMES) {
    visibility[game.id] = byId.get(game.id) ?? true;
  }
  return visibility;
}

export async function setGameActive(id: GameId, active: boolean): Promise<void> {
  await prisma.gameConfig.upsert({
    where: { id },
    update: { active },
    create: { id, active },
  });
}
