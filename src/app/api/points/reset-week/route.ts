import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getChildPointTotal } from "@/lib/points";
import { currentWeekStart } from "@/lib/date";

// Lighter than /api/points/reset: only neutralizes the point total (one
// compensating ledger entry), nothing else touched — task/checklist history
// stays intact, and the archived total keeps showing up in Tổng kết điểm's
// weekly/monthly/quarterly/yearly views since those are just grouped sums
// over the same ledger.
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

  const currentTotal = await getChildPointTotal(childId);
  if (currentTotal !== 0) {
    await prisma.pointLedger.create({
      data: {
        childId,
        delta: -currentTotal,
        reason: `Reset điểm tuần (tuần ${currentWeekStart()}) — đã lưu ${currentTotal} sao vào lịch sử`,
        approvedById: session.id,
      },
    });
  }

  return NextResponse.json({ ok: true, archived: currentTotal });
}
