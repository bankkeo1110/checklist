import Link from "next/link";
import { redirect } from "next/navigation";
import UnitConversionGame from "@/components/child/games/UnitConversionGame";
import { getGameVisibility } from "@/lib/games";

export const dynamic = "force-dynamic";

export default async function UnitConversionGamePage() {
  const visibility = await getGameVisibility();
  if (!visibility.units) redirect("/child/games");

  return (
    <div className="flex flex-col gap-4">
      <Link href="/child/games" className="text-[13px] font-bold text-blue-text">
        ← Back to games
      </Link>
      <UnitConversionGame />
    </div>
  );
}
