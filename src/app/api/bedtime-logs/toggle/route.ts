import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { currentWeekStart, dateStrToUTCDate, todayDateStr, weekStartForDateStr } from "@/lib/date";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.kind !== "child") {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const bedtimeItemId = body?.bedtimeItemId;
  const today = todayDateStr();
  const date = typeof body?.date === "string" ? body.date : today;
  if (typeof bedtimeItemId !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 400 });
  }
  if (body?.checked !== true) {
    return NextResponse.json({ error: "Chỉ có thể đánh dấu đã hoàn thành, không bỏ tích được." }, { status: 400 });
  }
  if (date > today || weekStartForDateStr(date) !== currentWeekStart()) {
    return NextResponse.json({ error: "Ngày không hợp lệ." }, { status: 400 });
  }

  const item = await prisma.bedtimeItem.findFirst({ where: { id: bedtimeItemId, active: true } });
  if (!item) {
    return NextResponse.json({ error: "Không tìm thấy mục." }, { status: 404 });
  }

  const existing = await prisma.bedtimeLog.findUnique({
    where: { childId_bedtimeItemId_date: { childId: session.id, bedtimeItemId, date: dateStrToUTCDate(date) } },
  });
  if (existing?.checked) {
    return NextResponse.json({ ok: true });
  }

  await prisma.$transaction(async (tx) => {
    const log = await tx.bedtimeLog.upsert({
      where: { childId_bedtimeItemId_date: { childId: session.id, bedtimeItemId, date: dateStrToUTCDate(date) } },
      update: { checked: true },
      create: { childId: session.id, bedtimeItemId, date: dateStrToUTCDate(date), checked: true },
    });
    await tx.pointLedger.create({
      data: {
        childId: session.id,
        bedtimeLogId: log.id,
        delta: item.points,
        reason: `Hoàn thành: ${item.label} (${date})`,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
