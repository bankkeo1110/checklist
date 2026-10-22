import Link from "next/link";
import { redirect } from "next/navigation";
import MathRaceGame from "@/components/child/games/MathRaceGame";
import { getGameVisibility } from "@/lib/games";

export const dynamic = "force-dynamic";

export default async function MathRaceGamePage() {
  const visibility = await getGameVisibility();
  if (!visibility.mathrace) redirect("/child/games");

  return (
    <div className="flex flex-col gap-4">
      <Link href="/child/games" className="text-[13px] font-bold text-blue-text">
        ← Back to games
      </Link>
      <MathRaceGame />
    </div>
  );
}
