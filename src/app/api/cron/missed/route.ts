import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reconcileMissedDaysForChild } from "@/lib/reconcile";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Không có quyền." }, { status: 401 });
  }

  const children = await prisma.child.findMany({ select: { id: true } });
  for (const child of children) {
    await reconcileMissedDaysForChild(child.id);
  }

  return NextResponse.json({ ok: true, childrenReconciled: children.length });
}
