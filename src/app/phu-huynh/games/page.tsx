import { GAMES, getGameVisibility } from "@/lib/games";
import GameVisibilityManager from "@/components/phu-huynh/GameVisibilityManager";

export const dynamic = "force-dynamic";

export default async function ParentGamesPage() {
  const visibility = await getGameVisibility();
  const games = GAMES.map((game) => ({ ...game, active: visibility[game.id] }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">Trò chơi thưởng</h1>
        <p className="text-sm font-semibold text-muted">
          Ẩn/hiện tạm thời các game thưởng trong menu của con. Game &quot;Tạm ẩn&quot; sẽ biến mất khỏi
          /child/games — con không mở được link trực tiếp của game đó nữa.
        </p>
      </div>
      <GameVisibilityManager games={games} />
    </div>
  );
}
