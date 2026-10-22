import Link from "next/link";
import { GAMES, getGameVisibility } from "@/lib/games";

export const dynamic = "force-dynamic";

export default async function GamesMenuPage() {
  const visibility = await getGameVisibility();
  const games = GAMES.filter((game) => visibility[game.id]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-[19px] font-bold">🎮 Reward Games</h2>
        <p className="text-[13.5px] font-semibold text-muted">Pick a game to play.</p>
      </div>
      {games.length === 0 ? (
        <p className="rounded-[22px] bg-white p-5 text-center text-[13.5px] font-semibold text-muted shadow-md">
          No games are turned on right now — ask a parent to turn one on!
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {games.map((game) => (
            <Link
              key={game.href}
              href={game.href}
              className="flex flex-col gap-2 rounded-[22px] bg-white p-5 shadow-md transition-transform hover:-translate-y-0.5"
            >
              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-[22px] ${game.accent}`}>
                {game.emoji}
              </span>
              <span className="font-display text-[16px] font-bold">{game.title}</span>
              <span className="text-[13px] font-semibold text-muted">{game.blurb}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
