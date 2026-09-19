import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isValidStarCount } from "@/lib/stars";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.kind !== "parent") {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);

  const data: { title?: string; points?: number; active?: boolean; assignedTo?: { set: { id: string }[] } } = {};
  if (typeof body?.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (body?.points !== undefined) {
    const points = Number(body.points);
    if (!isValidStarCount(points)) {
      return NextResponse.json({ error: "Số sao phải từ 1 đến 5." }, { status: 400 });
    }
    data.points = points;
  }
  if (typeof body?.active === "boolean") data.active = body.active;
  if (Array.isArray(body?.childIds)) {
    const childIds = body.childIds.filter((c: unknown) => typeof c === "string");
    if (childIds.length === 0) {
      return NextResponse.json({ error: "Phải giao cho ít nhất một con." }, { status: 400 });
    }
    data.assignedTo = { set: childIds.map((cid: string) => ({ id: cid })) };
  }

  const task = await prisma.task.update({
    where: { id },
    data,
    include: { assignedTo: true },
  });
  return NextResponse.json({ task });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.kind !== "parent") {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }
  const { id } = await params;

  const instanceCount = await prisma.taskInstance.count({ where: { taskId: id } });
  if (instanceCount === 0) {
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ ok: true, deleted: true });
  }

  await prisma.task.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ ok: true, deactivated: true });
}
