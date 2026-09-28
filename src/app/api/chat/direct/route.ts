import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getOrCreateDirect, sessionKind } from "@/lib/chat";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const kind = body?.kind;
  const id = body?.id;
  if ((kind !== "CHILD" && kind !== "PARENT") || typeof id !== "string") {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 400 });
  }

  const me = { kind: sessionKind(session), id: session.id };
  if (me.kind === kind && me.id === id) {
    return NextResponse.json({ error: "Không thể tự nhắn cho mình." }, { status: 400 });
  }
  const exists =
    kind === "CHILD"
      ? await prisma.child.findUnique({ where: { id } })
      : await prisma.parent.findUnique({ where: { id } });
  if (!exists) {
    return NextResponse.json({ error: "Không tìm thấy người này." }, { status: 404 });
  }

  const conversation = await getOrCreateDirect(me, { kind, id });
  return NextResponse.json({ id: conversation.id });
}
