import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, setSession } from "@/lib/auth";
import { hashPin, verifyPin } from "@/lib/pin";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const currentPin = typeof body?.currentPin === "string" ? body.currentPin : "";
  const newPin = typeof body?.newPin === "string" ? body.newPin : "";

  if (!/^\d{4,6}$/.test(newPin)) {
    return NextResponse.json({ error: "Mã PIN mới phải có 4-6 chữ số." }, { status: 400 });
  }

  if (session.kind === "child") {
    const child = await prisma.child.findUnique({ where: { id: session.id } });
    if (!child || !verifyPin(currentPin, child.pinHash)) {
      return NextResponse.json({ error: "Mã PIN hiện tại không đúng." }, { status: 401 });
    }
    const updated = await prisma.child.update({
      where: { id: child.id },
      data: { pinHash: hashPin(newPin), sessionVersion: { increment: 1 } },
    });
    // Re-issue the session with the bumped version so this browser stays
    // logged in — only *other* sessions still on the old PIN get kicked out.
    await setSession({ kind: "child", id: updated.id, name: updated.name, label: updated.label, sessionVersion: updated.sessionVersion });
  } else {
    const parent = await prisma.parent.findUnique({ where: { id: session.id } });
    if (!parent || !verifyPin(currentPin, parent.pinHash)) {
      return NextResponse.json({ error: "Mã PIN hiện tại không đúng." }, { status: 401 });
    }
    const updated = await prisma.parent.update({
      where: { id: parent.id },
      data: { pinHash: hashPin(newPin), sessionVersion: { increment: 1 } },
    });
    await setSession({ kind: "parent", id: updated.id, name: updated.name, label: updated.label, sessionVersion: updated.sessionVersion });
  }

  return NextResponse.json({ ok: true });
}
