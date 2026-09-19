import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { currentWeekStart, dateStrToUTCDate, todayDateStr } from "@/lib/date";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.kind !== "child") {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const taskId = body?.taskId;
  if (typeof taskId !== "string") {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 400 });
  }

  const task = await prisma.task.findFirst({
    where: { id: taskId, active: true, assignedTo: { some: { id: session.id } } },
  });
  if (!task) {
    return NextResponse.json({ error: "Không tìm thấy nhiệm vụ." }, { status: 404 });
  }

  const today = todayDateStr();
  const existing = await prisma.taskInstance.findUnique({
    where: { taskId_childId_date: { taskId, childId: session.id, date: dateStrToUTCDate(today) } },
  });

  if (existing?.status === "APPROVED" || existing?.status === "CLAIMED") {
    return NextResponse.json({ ok: true, status: existing.status });
  }

  if (existing) {
    await prisma.$transaction([
      prisma.pointLedger.deleteMany({ where: { taskInstanceId: existing.id } }),
      prisma.taskInstance.update({
        where: { id: existing.id },
        data: { status: "CLAIMED", claimedAt: new Date(), reviewedAt: null, reviewedById: null, note: null },
      }),
    ]);
  } else {
    await prisma.taskInstance.create({
      data: {
        taskId,
        childId: session.id,
        date: dateStrToUTCDate(today),
        weekStart: dateStrToUTCDate(currentWeekStart()),
        status: "CLAIMED",
        claimedAt: new Date(),
      },
    });
  }

  return NextResponse.json({ ok: true, status: "CLAIMED" });
}
