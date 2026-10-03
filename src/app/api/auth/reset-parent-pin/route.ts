import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PARENT_PIN, hashPin } from "@/lib/pin";

// Deliberately unauthenticated — this backs the hidden /reset recovery page
// for a parent who's locked themselves out and has no valid session to
// prove who they are. Reachable only by knowing the URL.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parentId = body?.parentId;
  if (typeof parentId !== "string") {
    return NextResponse.json({ error: "Thiếu phụ huynh." }, { status: 400 });
  }

  const parent = await prisma.parent.findUnique({ where: { id: parentId } });
  if (!parent) {
    return NextResponse.json({ error: "Không tìm thấy tài khoản." }, { status: 404 });
  }

  // Bumps sessionVersion too — this is explicitly a "I think someone else
  // has access" recovery flow, so it must kick out any session already
  // logged in under the old PIN, not just change what PIN works going forward.
  await prisma.parent.update({
    where: { id: parentId },
    data: { pinHash: hashPin(DEFAULT_PARENT_PIN), sessionVersion: { increment: 1 } },
  });

  return NextResponse.json({ ok: true, pin: DEFAULT_PARENT_PIN });
}
