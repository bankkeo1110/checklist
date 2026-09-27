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
  const checked = body?.checked;
  if (typeof subjectItemId !== "string" || typeof checked !== "boolean") {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 400 });
  }

  const item = await prisma.subjectItem.findFirst({ where: { id: subjectItemId, active: true } });
  if (!item) {
    return NextResponse.json({ error: "Không tìm thấy mục." }, { status: 404 });
  }

  const weekStart = currentWeekStart();

  await prisma.$transaction(async (tx) => {
    const log = await tx.subjectLog.upsert({
      where: {
        childId_subjectItemId_weekStart: {
          childId: session.id,
          subjectItemId,
          weekStart: dateStrToUTCDate(weekStart),
        },
      },
      update: { checked },
      create: {
        childId: session.id,
        subjectItemId,
        weekStart: dateStrToUTCDate(weekStart),
        checked,
      },
    });

    if (checked) {
      const existing = await tx.pointLedger.findFirst({ where: { subjectLogId: log.id } });
      if (!existing) {
        await tx.pointLedger.create({
          data: {
            childId: session.id,
            subjectLogId: log.id,
            delta: item.points,
            reason: `Nhận xét của cô: ${item.label} (tuần ${weekStart})`,
          },
        });
      }
    } else {
      await tx.pointLedger.deleteMany({ where: { subjectLogId: log.id } });
    }
  });

  return NextResponse.json({ ok: true });
}
