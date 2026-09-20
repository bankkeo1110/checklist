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

  const data: { label?: string; active?: boolean; points?: number } = {};
  if (typeof body?.label === "string" && body.label.trim()) data.label = body.label.trim();
  if (typeof body?.active === "boolean") data.active = body.active;
  if (body?.points !== undefined) {
    const points = Number(body.points);
    if (!isValidStarCount(points)) {
      return NextResponse.json({ error: "Số sao phải là số nguyên dương." }, { status: 400 });
    }
    data.points = points;
  }

  const item = await prisma.wakeupItem.update({ where: { id }, data });
  return NextResponse.json({ item });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.kind !== "parent") {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }
  const { id } = await params;

  const logCount = await prisma.wakeupLog.count({ where: { wakeupItemId: id } });
  if (logCount === 0) {
    await prisma.wakeupItem.delete({ where: { id } });
    return NextResponse.json({ ok: true, deleted: true });
  }
  await prisma.wakeupItem.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ ok: true, deactivated: true });
}
