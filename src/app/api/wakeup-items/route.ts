import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DEFAULT_STARS, isValidStarCount } from "@/lib/stars";

export async function GET() {
  const session = await getSession();
  if (!session || session.kind !== "parent") {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }
  const items = await prisma.wakeupItem.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.kind !== "parent") {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const label = typeof body?.label === "string" ? body.label.trim() : "";
  const points = body?.points === undefined ? DEFAULT_STARS : Number(body.points);
  if (!label || !isValidStarCount(points)) {
    return NextResponse.json({ error: "Thiếu nội dung hoặc số sao không hợp lệ." }, { status: 400 });
  }
  const maxOrder = await prisma.wakeupItem.aggregate({ _max: { sortOrder: true } });
  const item = await prisma.wakeupItem.create({
    data: { label, points, sortOrder: (maxOrder._max.sortOrder ?? -1) + 1 },
  });
  return NextResponse.json({ item });
}
