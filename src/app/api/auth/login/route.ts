import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPin } from "@/lib/pin";
import { setSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const kind = body?.kind;
  const id = body?.id;
  const pin = body?.pin;

  if (
    (kind !== "child" && kind !== "parent") ||
    typeof id !== "string" ||
    typeof pin !== "string"
  ) {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 400 });
  }

  if (kind === "child") {
    const child = await prisma.child.findUnique({ where: { id } });
    if (!child || !verifyPin(pin, child.pinHash)) {
      return NextResponse.json({ error: "Mã PIN không đúng." }, { status: 401 });
    }
    await setSession({ kind: "child", id: child.id, name: child.name, label: child.label });
    return NextResponse.json({ ok: true, redirect: "/child" });
  }

  const parent = await prisma.parent.findUnique({ where: { id } });
  if (!parent || !verifyPin(pin, parent.pinHash)) {
    return NextResponse.json({ error: "Mã PIN không đúng." }, { status: 401 });
  }
  await setSession({ kind: "parent", id: parent.id, name: parent.name, label: parent.label });
  return NextResponse.json({ ok: true, redirect: "/phu-huynh" });
}
