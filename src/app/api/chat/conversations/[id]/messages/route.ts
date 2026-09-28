import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { MAX_MESSAGE_LENGTH, getMembership, getMessages, markRead, sessionKind } from "@/lib/chat";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }
  const { id } = await params;
  if (!(await getMembership(id, session))) {
    return NextResponse.json({ error: "Không tìm thấy cuộc trò chuyện." }, { status: 404 });
  }

  const afterParam = req.nextUrl.searchParams.get("after");
  const after = afterParam ? new Date(afterParam) : undefined;
  const messages = await getMessages(id, session, {
    after: after && !Number.isNaN(after.getTime()) ? after : undefined,
  });
  await markRead(id, session);
  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }
  const { id } = await params;
  if (!(await getMembership(id, session))) {
    return NextResponse.json({ error: "Không tìm thấy cuộc trò chuyện." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const text = typeof body?.body === "string" ? body.body.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "Tin nhắn trống." }, { status: 400 });
  }
  if (text.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: `Tin nhắn tối đa ${MAX_MESSAGE_LENGTH} ký tự.` }, { status: 400 });
  }

  const message = await prisma.chatMessage.create({
    data: { conversationId: id, senderKind: sessionKind(session), senderId: session.id, body: text },
  });
  await Promise.all([
    prisma.conversation.update({ where: { id }, data: { lastMessageAt: message.createdAt } }),
    markRead(id, session),
  ]);

  return NextResponse.json({
    message: {
      id: message.id,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
      senderName: session.name,
      senderLabel: session.label,
      mine: true,
    },
  });
}
