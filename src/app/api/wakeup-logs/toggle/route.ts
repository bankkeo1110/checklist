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
  const wakeupItemId = body?.wakeupItemId;
  const checked = body?.checked;
  if (typeof wakeupItemId !== "string" || typeof checked !== "boolean") {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 400 });
  }

  const item = await prisma.wakeupItem.findFirst({ where: { id: wakeupItemId, active: true } });
  if (!item) {
    return NextResponse.json({ error: "Không tìm thấy mục." }, { status: 404 });
  }

  const today = todayDateStr();
  await prisma.wakeupLog.upsert({
    where: {
      childId_wakeupItemId_date: {
        childId: session.id,
        wakeupItemId,
        date: dateStrToUTCDate(today),
      },
    },
    update: { checked },
    create: {
      childId: session.id,
      wakeupItemId,
      date: dateStrToUTCDate(today),
      checked,
    },
  });

  return NextResponse.json({ ok: true });
}
