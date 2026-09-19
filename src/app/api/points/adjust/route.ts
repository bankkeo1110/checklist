import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.kind !== "parent") {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const childId = body?.childId;
  const delta = Number(body?.delta);
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

  if (typeof childId !== "string" || !Number.isInteger(delta) || delta === 0 || !reason) {
    return NextResponse.json({ error: "Thiếu con, số điểm (khác 0), hoặc lý do." }, { status: 400 });
  }

  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child) {
    return NextResponse.json({ error: "Không tìm thấy con." }, { status: 404 });
  }

  await prisma.pointLedger.create({
    data: {
      childId,
      delta,
      reason: `Điều chỉnh thủ công: ${reason}`,
      approvedById: session.id,
    },
  });

  return NextResponse.json({ ok: true });
}
