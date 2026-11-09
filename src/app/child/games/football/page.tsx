import Link from "next/link";
import { redirect } from "next/navigation";
import FootballGame from "@/components/child/games/FootballGame";
import { getGameVisibility } from "@/lib/games";

export const dynamic = "force-dynamic";

export default async function FootballGamePage() {
  const visibility = await getGameVisibility();
  if (!visibility.football) redirect("/child/games");

  return (
    <div className="flex flex-col gap-4">
      <Link href="/child/games" className="text-[13px] font-bold text-blue-text">
        ← Back to games
      </Link>
      <FootballGame />
    </div>
  );
}
