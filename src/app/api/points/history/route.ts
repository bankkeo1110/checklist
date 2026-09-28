import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const MAX_TAKE = 50;

// Older point-ledger entries, newest first, for "Xem thêm" on the kid page.
// Kids only see their own history; parents pass ?childId=.
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const childId = session.kind === "child" ? session.id : params.get("childId");
  if (!childId) {
    return NextResponse.json({ error: "Thiếu con." }, { status: 400 });
  }
  const take = Math.min(Math.max(Number(params.get("take")) || 10, 1), MAX_TAKE);
  const cursor = params.get("cursor");

  const rows = await prisma.pointLedger.findMany({
    where: { childId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  return NextResponse.json({
    entries: rows.slice(0, take).map((r) => ({
      id: r.id,
      delta: r.delta,
      reason: r.reason,
      createdAt: r.createdAt.toISOString(),
    })),
    hasMore: rows.length > take,
  });
}
