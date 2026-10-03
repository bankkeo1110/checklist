import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, setSession } from "@/lib/auth";
import { DEFAULT_CHILD_PIN, hashPin, verifyPin } from "@/lib/pin";

const PIN_PATTERN = /^\d{4,6}$/;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.kind !== "parent") {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const kind = body?.kind;
  const id = body?.id;
  const currentPin = body?.currentPin;
  const reset = body?.reset === true;
  const newPin = reset && kind === "child" ? DEFAULT_CHILD_PIN : body?.newPin;

  if ((kind !== "child" && kind !== "parent") || typeof id !== "string") {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 400 });
  }
  if (typeof newPin !== "string" || !PIN_PATTERN.test(newPin)) {
    return NextResponse.json({ error: "Mã PIN mới phải gồm 4–6 chữ số." }, { status: 400 });
  }

  if (kind === "child") {
    const child = await prisma.child.findUnique({ where: { id } });
    if (!child) {
      return NextResponse.json({ error: "Không tìm thấy con." }, { status: 404 });
    }
    // Bumping sessionVersion kicks out whoever's currently logged in as this
    // child (e.g. if that's exactly why a parent is resetting the PIN here).
    await prisma.child.update({ where: { id }, data: { pinHash: hashPin(newPin), sessionVersion: { increment: 1 } } });
    return NextResponse.json({ ok: true });
  }

  // Parents may only change their own PIN, and must confirm the current one.
  if (id !== session.id) {
    return NextResponse.json({ error: "Chỉ được đổi mã PIN của chính mình." }, { status: 403 });
  }
  const parent = await prisma.parent.findUnique({ where: { id } });
  if (!parent) {
    return NextResponse.json({ error: "Không tìm thấy tài khoản." }, { status: 404 });
  }
  if (typeof currentPin !== "string" || !verifyPin(currentPin, parent.pinHash)) {
    return NextResponse.json({ error: "Mã PIN hiện tại không đúng." }, { status: 401 });
  }
  const updated = await prisma.parent.update({
    where: { id },
    data: { pinHash: hashPin(newPin), sessionVersion: { increment: 1 } },
  });
  // Re-issue so this browser (the one that just proved the current PIN)
  // stays logged in; any other session on the old PIN is now invalid.
  await setSession({ kind: "parent", id: updated.id, name: updated.name, label: updated.label, sessionVersion: updated.sessionVersion });
  return NextResponse.json({ ok: true });
}
