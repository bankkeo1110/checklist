import Link from "next/link";
import TypingGame from "@/components/child/games/TypingGame";

export const dynamic = "force-dynamic";

export default function TypingGamePage() {
  return (
    <div className="flex flex-col gap-4">
      <Link href="/child/games" className="text-[13px] font-bold text-blue-text">
        ← Back to games
      </Link>
      <TypingGame />
    </div>
  );
}
