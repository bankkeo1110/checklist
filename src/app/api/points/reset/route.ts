import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { dateStrToUTCDate, todayDateStr } from "@/lib/date";

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

  // Plain sequential deletes, not wrapped in $transaction([...]) — that array
  // form runs under one interactive transaction with Prisma's 5s default
  // timeout, and against a child with a lot of history this measured 7-8s
  // against the real database, silently failing the whole reset. None of
  // these deletes need atomicity with each other (deleteMany is idempotent,
  // so a retry after a partial failure just finishes the job).
  await prisma.pointLedger.deleteMany({ where: { childId } });
  await prisma.animalUnlock.deleteMany({ where: { childId } });
  await prisma.taskInstance.deleteMany({ where: { childId } });
  await prisma.bedtimeLog.deleteMany({ where: { childId } });
  await prisma.wakeupLog.deleteMany({ where: { childId } });
  await prisma.subjectLog.deleteMany({ where: { childId } });
  // Moves reconcileMissedDaysForChild's floor to today, so the very next
  // page load doesn't immediately re-derive the same "didn't check in"
  // penalties for every day since each task was created and undo the reset.
  await prisma.child.update({
    where: { id: childId },
    data: { historyResetAt: dateStrToUTCDate(todayDateStr()) },
  });
  await prisma.pointLedger.create({
    data: {
      childId,
      delta: 0,
      reason: "Reset toàn bộ lịch sử (điểm, nhiệm vụ, checklist, thú cưng)",
      approvedById: session.id,
    },
  });

  return NextResponse.json({ ok: true });
}
