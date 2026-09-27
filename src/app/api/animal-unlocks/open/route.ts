import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getChildEarnedTotal } from "@/lib/points";
import { ANIMAL_TIERS } from "@/lib/animals";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.kind !== "child") {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const threshold = Number(body?.threshold);
  const tier = ANIMAL_TIERS.find((t) => t.threshold === threshold);
  if (!tier) {
    return NextResponse.json({ error: "Mức không hợp lệ." }, { status: 400 });
  }

  const earnedTotal = await getChildEarnedTotal(session.id);
  if (earnedTotal < threshold) {
    return NextResponse.json({ error: "Chưa đủ sao để mở con vật này." }, { status: 403 });
  }

  await prisma.animalUnlock.upsert({
    where: { childId_threshold: { childId: session.id, threshold } },
    update: {},
    create: { childId: session.id, threshold },
  });

  return NextResponse.json({ ok: true });
}
