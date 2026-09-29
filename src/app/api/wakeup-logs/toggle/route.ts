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
  const wakeupItemId = body?.wakeupItemId;
  const today = todayDateStr();
  const date = typeof body?.date === "string" ? body.date : today;
  if (typeof wakeupItemId !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 400 });
  }
  if (body?.checked !== true) {
    return NextResponse.json({ error: "Chỉ có thể đánh dấu đã hoàn thành, không bỏ tích được." }, { status: 400 });
  }
  // Bé check được cho hôm nay hoặc ngày đã qua trong tuần hiện tại, không
  // cho check trước cho ngày chưa tới.
  if (date > today || weekStartForDateStr(date) !== currentWeekStart()) {
    return NextResponse.json({ error: "Ngày không hợp lệ." }, { status: 400 });
  }

  const item = await prisma.wakeupItem.findFirst({ where: { id: wakeupItemId, active: true } });
  if (!item) {
    return NextResponse.json({ error: "Không tìm thấy mục." }, { status: 404 });
  }

  const existing = await prisma.wakeupLog.findUnique({
    where: { childId_wakeupItemId_date: { childId: session.id, wakeupItemId, date: dateStrToUTCDate(date) } },
  });
  if (existing?.checked) {
    return NextResponse.json({ ok: true });
  }

  await prisma.$transaction(async (tx) => {
    const log = await tx.wakeupLog.upsert({
      where: { childId_wakeupItemId_date: { childId: session.id, wakeupItemId, date: dateStrToUTCDate(date) } },
      update: { checked: true },
      create: { childId: session.id, wakeupItemId, date: dateStrToUTCDate(date), checked: true },
    });
    await tx.pointLedger.create({
      data: {
        childId: session.id,
        wakeupLogId: log.id,
        delta: item.points,
        reason: `Hoàn thành: ${item.label} (${date})`,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
