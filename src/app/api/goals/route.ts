import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { currentWeekStart, dateStrToUTCDate } from "@/lib/date";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.kind !== "parent") {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const childId = body?.childId;
  const goalText = typeof body?.goalText === "string" ? body.goalText.trim() : "";
  const weekStart = typeof body?.weekStart === "string" ? body.weekStart : currentWeekStart();

  if (typeof childId !== "string") {
    return NextResponse.json({ error: "Thiếu con." }, { status: 400 });
  }

  const goal = await prisma.weeklyGoal.upsert({
    where: { childId_weekStart: { childId, weekStart: dateStrToUTCDate(weekStart) } },
    update: { goalText },
    create: { childId, weekStart: dateStrToUTCDate(weekStart), goalText },
  });

  return NextResponse.json({ goal });
}
