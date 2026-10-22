import Link from "next/link";

export const dynamic = "force-dynamic";

const GAMES = [
  {
    href: "/child/games/typing",
    emoji: "⌨️",
    title: "Typing Race",
    blurb: "Type English words and sentences fast and correctly.",
    accent: "bg-blue-tint text-blue-text",
  },
  {
    href: "/child/games/units",
    emoji: "📏",
    title: "Unit Convert",
    blurb: "Convert between m, cm, km, m², ha, kg, g, l and ml.",
    accent: "bg-green-tint text-green-text",
  },
];

export default function GamesMenuPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-[19px] font-bold">🎮 Reward Games</h2>
        <p className="text-[13.5px] font-semibold text-muted">
          Pick a game to play.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {GAMES.map((game) => (
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
    </div>
  );
}
