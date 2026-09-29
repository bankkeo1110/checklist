import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { currentWeekStart, dateStrToUTCDate } from "@/lib/date";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.kind !== "child") {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const subjectItemId = body?.subjectItemId;
  if (typeof subjectItemId !== "string") {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 400 });
  }
  if (body?.checked !== true) {
    return NextResponse.json({ error: "Chỉ có thể đánh dấu đã hoàn thành, không bỏ tích được." }, { status: 400 });
  }

  const item = await prisma.subjectItem.findFirst({ where: { id: subjectItemId, active: true } });
  if (!item) {
    return NextResponse.json({ error: "Không tìm thấy mục." }, { status: 404 });
  }

  const weekStart = currentWeekStart();

  const existing = await prisma.subjectLog.findUnique({
    where: { childId_subjectItemId_weekStart: { childId: session.id, subjectItemId, weekStart: dateStrToUTCDate(weekStart) } },
  });
  if (existing?.checked) {
    return NextResponse.json({ ok: true });
  }

  await prisma.$transaction(async (tx) => {
    const log = await tx.subjectLog.upsert({
      where: {
        childId_subjectItemId_weekStart: { childId: session.id, subjectItemId, weekStart: dateStrToUTCDate(weekStart) },
      },
      update: { checked: true },
      create: { childId: session.id, subjectItemId, weekStart: dateStrToUTCDate(weekStart), checked: true },
    });
    await tx.pointLedger.create({
      data: {
        childId: session.id,
        subjectLogId: log.id,
        delta: item.points,
        reason: `Nhận xét của cô: ${item.label} (tuần ${weekStart})`,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
