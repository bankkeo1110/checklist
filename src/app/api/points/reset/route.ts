import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Full reset: wipes everything derived from activity for this child — the
// weekly-grid claims, the daily/weekly checklist check-ins, the point
// ledger (current balance and the lifetime-earned total animal tiers key
// off), and the opened animals — then leaves one zero-delta marker entry so
// "reset đã xảy ra lúc nào" still shows up in the history list. Task/item
// definitions and the child account itself are untouched.
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
    prisma.taskInstance.deleteMany({ where: { childId } }),
    prisma.bedtimeLog.deleteMany({ where: { childId } }),
    prisma.wakeupLog.deleteMany({ where: { childId } }),
    prisma.subjectLog.deleteMany({ where: { childId } }),
    prisma.pointLedger.create({
      data: {
        childId,
        delta: 0,
        reason: "Reset toàn bộ lịch sử (điểm, nhiệm vụ, checklist, thú cưng)",
        approvedById: session.id,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
