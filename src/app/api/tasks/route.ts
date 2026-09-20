import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DEFAULT_STARS, isValidStarCount } from "@/lib/stars";

export async function GET() {
  const session = await getSession();
  if (!session || session.kind !== "parent") {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }
  const tasks = await prisma.task.findMany({
    include: { assignedTo: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.kind !== "parent") {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const points = body?.points === undefined ? DEFAULT_STARS : Number(body.points);
  const childIds = Array.isArray(body?.childIds) ? body.childIds.filter((c: unknown) => typeof c === "string") : [];

  if (!title || !isValidStarCount(points) || childIds.length === 0) {
    return NextResponse.json({ error: "Thiếu tên, số sao hợp lệ, hoặc con được giao." }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      title,
      points,
      assignedTo: { connect: childIds.map((id: string) => ({ id })) },
    },
    include: { assignedTo: true },
  });

  return NextResponse.json({ task });
}
