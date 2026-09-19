import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.kind !== "parent") {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }
  const items = await prisma.bedtimeItem.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.kind !== "parent") {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const label = typeof body?.label === "string" ? body.label.trim() : "";
  if (!label) {
    return NextResponse.json({ error: "Thiếu nội dung." }, { status: 400 });
  }
  const maxOrder = await prisma.bedtimeItem.aggregate({ _max: { sortOrder: true } });
  const item = await prisma.bedtimeItem.create({
    data: { label, sortOrder: (maxOrder._max.sortOrder ?? -1) + 1 },
  });
  return NextResponse.json({ item });
}
