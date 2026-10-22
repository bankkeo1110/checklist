import Link from "next/link";
import { redirect } from "next/navigation";
import TypingGame from "@/components/child/games/TypingGame";
import { getGameVisibility } from "@/lib/games";

export const dynamic = "force-dynamic";

export default async function TypingGamePage() {
  const visibility = await getGameVisibility();
  if (!visibility.typing) redirect("/child/games");

  return (
    <div className="flex flex-col gap-4">
      <Link href="/child/games" className="text-[13px] font-bold text-blue-text">
        ← Back to games
      </Link>
      <TypingGame />
    </div>
  );
}
