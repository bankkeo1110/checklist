import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Full reset: clears the point ledger (so both the current balance and the
// lifetime-earned total used for animal tiers go back to 0) and the child's
// opened animals, then leaves one zero-delta marker entry so "reset đã xảy
// ra lúc nào" stays visible in the history list.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.kind !== "parent") {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const childId = body?.childId;
  if (typeof childId !== "string") {
    return NextResponse.json({ error: "Thiếu con." }, { status: 400 });
  }

  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child) {
    return NextResponse.json({ error: "Không tìm thấy con." }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.pointLedger.deleteMany({ where: { childId } }),
    prisma.animalUnlock.deleteMany({ where: { childId } }),
    prisma.pointLedger.create({
      data: {
        childId,
        delta: 0,
        reason: "Reset toàn bộ điểm và bộ sưu tập thú cưng",
        approvedById: session.id,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
