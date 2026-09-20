import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { dateStrToUTCDate, todayDateStr } from "@/lib/date";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.kind !== "child") {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const bedtimeItemId = body?.bedtimeItemId;
  const checked = body?.checked;
  if (typeof bedtimeItemId !== "string" || typeof checked !== "boolean") {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 400 });
  }

  const item = await prisma.bedtimeItem.findFirst({ where: { id: bedtimeItemId, active: true } });
  if (!item) {
    return NextResponse.json({ error: "Không tìm thấy mục." }, { status: 404 });
  }

  const today = todayDateStr();

  await prisma.$transaction(async (tx) => {
    const log = await tx.bedtimeLog.upsert({
      where: {
        childId_bedtimeItemId_date: {
          childId: session.id,
          bedtimeItemId,
          date: dateStrToUTCDate(today),
        },
      },
      update: { checked },
      create: {
        childId: session.id,
        bedtimeItemId,
        date: dateStrToUTCDate(today),
        checked,
      },
    });

    if (checked) {
      const existing = await tx.pointLedger.findFirst({ where: { bedtimeLogId: log.id } });
      if (!existing) {
        await tx.pointLedger.create({
          data: {
            childId: session.id,
            bedtimeLogId: log.id,
            delta: item.points,
            reason: `Hoàn thành: ${item.label} (${today})`,
          },
        });
      }
    } else {
      await tx.pointLedger.deleteMany({ where: { bedtimeLogId: log.id } });
    }
  });

  return NextResponse.json({ ok: true });
}
