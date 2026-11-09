import Link from "next/link";
import FootballGame from "@/components/child/games/FootballGame";

export default function ParentFootballPreviewPage() {
  return (
    <div className="flex flex-col gap-4">
      <Link href="/phu-huynh/games" className="text-sm font-bold text-blue-text">
        ← Trò chơi thưởng
      </Link>
      <FootballGame preview />
    </div>
  );
}
