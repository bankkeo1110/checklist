import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getChildPointTotals } from "@/lib/points";
import { currentWeekStart } from "@/lib/date";

// Lighter than /api/points/reset: only neutralizes each child's point total
// (one compensating ledger entry per child), nothing else touched —
// task/checklist history stays intact, and the archived totals keep showing
// up in Tổng kết điểm's weekly/monthly/quarterly/yearly views since those
// are just grouped sums over the same ledger. One shared action for every
// child at once — not picked one at a time from the per-child tab.
export async function POST() {
  const session = await getSession();
  if (!session || session.kind !== "parent") {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const [children, totals] = await Promise.all([
    prisma.child.findMany({ select: { id: true } }),
    getChildPointTotals(),
  ]);

  const toReset = children.filter((c) => (totals[c.id] ?? 0) !== 0);
  if (toReset.length > 0) {
    await prisma.pointLedger.createMany({
      data: toReset.map((c) => ({
        childId: c.id,
        delta: -(totals[c.id] ?? 0),
        reason: `Reset điểm tuần (tuần ${currentWeekStart()}) — đã lưu ${totals[c.id]} sao vào lịch sử`,
        approvedById: session.id,
      })),
    });
  }

  const archived: Record<string, number> = {};
  for (const c of toReset) archived[c.id] = totals[c.id] ?? 0;
  return NextResponse.json({ ok: true, archived });
}
