import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getChildPointTotal } from "@/lib/points";
import { DRAGON_BALL_TIERS } from "@/lib/dragonball";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.kind !== "child") {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const threshold = Number(body?.threshold);
  const tier = DRAGON_BALL_TIERS.find((t) => t.threshold === threshold);
  if (!tier) {
    return NextResponse.json({ error: "Mức không hợp lệ." }, { status: 400 });
  }

  const currentTotal = await getChildPointTotal(session.id);
  if (currentTotal < threshold) {
    return NextResponse.json(
      { error: `Chưa đủ sao để lên ${tier.name} — cần ${threshold} sao, cố gắng hơn nhé!` },
      { status: 403 },
    );
  }

  await prisma.dragonBallUnlock.upsert({
    where: { childId_threshold: { childId: session.id, threshold } },
    update: {},
    create: { childId: session.id, threshold },
  });

  return NextResponse.json({ ok: true });
}
