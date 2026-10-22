import Link from "next/link";
import UnitConversionGame from "@/components/child/games/UnitConversionGame";

export const dynamic = "force-dynamic";

export default function UnitConversionGamePage() {
  return (
    <div className="flex flex-col gap-4">
      <Link href="/child/games" className="text-[13px] font-bold text-blue-text">
        ← Back to games
      </Link>
      <UnitConversionGame />
    </div>
  );
}
