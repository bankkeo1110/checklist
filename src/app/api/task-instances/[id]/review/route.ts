import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.kind !== "parent") {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const action = body?.action;
  const note = typeof body?.note === "string" && body.note.trim() ? body.note.trim() : null;

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 400 });
  }

  const instance = await prisma.taskInstance.findUnique({
    where: { id },
    include: { task: true },
  });
  if (!instance) {
    return NextResponse.json({ error: "Không tìm thấy." }, { status: 404 });
  }
  if (instance.status !== "CLAIMED") {
    return NextResponse.json({ error: "Mục này không còn chờ duyệt." }, { status: 409 });
  }

  const approved = action === "approve";
  const delta = approved ? instance.task.points : -instance.task.points;
  const dateStr = instance.date.toISOString().slice(0, 10);

  await prisma.$transaction([
    prisma.taskInstance.update({
      where: { id },
      data: {
        status: approved ? "APPROVED" : "REJECTED",
        reviewedAt: new Date(),
        reviewedById: session.id,
        note,
      },
    }),
    prisma.pointLedger.create({
      data: {
        childId: instance.childId,
        taskInstanceId: id,
        delta,
        reason: `${approved ? "Đã duyệt" : "Từ chối"}: ${instance.task.title} (${dateStr})${note ? ` — ${note}` : ""}`,
        approvedById: session.id,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
