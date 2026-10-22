"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Spinner from "@/components/Spinner";
import type { GameDef } from "@/lib/games";

type GameRow = GameDef & { active: boolean };

export default function GameVisibilityManager({ games }: { games: GameRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggle(game: GameRow) {
    setBusyId(game.id);
    try {
      await fetch(`/api/games/${game.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !game.active }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ul className="flex flex-col gap-2">
      {games.map((game) => (
        <li
          key={game.id}
          className={`flex items-center gap-3 rounded-2xl bg-white px-3.5 py-3 shadow-md ${
            game.active ? "" : "opacity-50"
          }`}
        >
          <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-2xl text-[18px] ${game.accent}`}>
            {game.emoji}
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold">{game.title}</p>
            <p className="text-[12px] font-semibold text-muted">{game.blurb}</p>
          </div>
          <button
            disabled={busyId === game.id}
            onClick={() => toggle(game)}
            className="flex flex-none items-center gap-1.5 rounded-full bg-divider px-3 py-1.5 text-[11.5px] font-bold text-muted"
          >
            {busyId === game.id && <Spinner size={12} />}
            {game.active ? "Tạm ẩn" : "Hiện lại"}
          </button>
        </li>
      ))}
    </ul>
  );
}
