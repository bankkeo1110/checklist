import { NextRequest, NextResponse } from "next/server";
import type { ChatMessage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { MAX_MESSAGE_LENGTH, getConversationPeople, getMembership, getMessages, markRead, sessionKind } from "@/lib/chat";
import { findSticker } from "@/lib/stickers";
import { parseMentions } from "@/lib/mentions";

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
  const [messages, members] = await Promise.all([
    getMessages(id, session, {
      after: after && !Number.isNaN(after.getTime()) ? after : undefined,
    }),
    // Only needed once per room-open, but cheap — used for @mention autocomplete/highlighting.
    getConversationPeople(id),
  ]);
  await markRead(id, session);
  return NextResponse.json({ messages, members, me: { kind: sessionKind(session), id: session.id } });
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
  const sticker = typeof body?.stickerId === "string" ? findSticker(body.stickerId) : undefined;
  if (body?.stickerId !== undefined && !sticker) {
    return NextResponse.json({ error: "Sticker không hợp lệ." }, { status: 400 });
  }
  const text = sticker ? sticker.emoji : typeof body?.body === "string" ? body.body.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "Tin nhắn trống." }, { status: 400 });
  }
  if (text.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: `Tin nhắn tối đa ${MAX_MESSAGE_LENGTH} ký tự.` }, { status: 400 });
  }

  let replyTo: ChatMessage | null = null;
  if (typeof body?.replyToId === "string") {
    const target = await prisma.chatMessage.findUnique({ where: { id: body.replyToId } });
    if (!target || target.conversationId !== id) {
      return NextResponse.json({ error: "Không tìm thấy tin nhắn để trả lời." }, { status: 400 });
    }
    replyTo = target;
  }

  const people = await getConversationPeople(id);
  const { mentionsEveryone, mentionedKeys } = parseMentions(text, people);

  const message = await prisma.chatMessage.create({
    data: {
      conversationId: id,
      senderKind: sessionKind(session),
      senderId: session.id,
      body: text,
      stickerId: sticker?.id ?? null,
      replyToId: replyTo?.id ?? null,
      mentionsEveryone,
      mentionedKeys,
    },
  });
  await Promise.all([
    prisma.conversation.update({ where: { id }, data: { lastMessageAt: message.createdAt } }),
    markRead(id, session),
  ]);

  const replySender = replyTo && people.find((p) => p.kind === replyTo.senderKind && p.id === replyTo.senderId);

  return NextResponse.json({
    message: {
      id: message.id,
      body: message.body,
      stickerId: message.stickerId,
      createdAt: message.createdAt.toISOString(),
      senderName: session.name,
      senderLabel: session.label,
      mine: true,
      replyTo: replyTo
        ? {
            id: replyTo.id,
            body: replyTo.body,
            stickerId: replyTo.stickerId,
            senderName: replySender?.name ?? "",
            senderLabel: replySender?.label ?? "?",
          }
        : null,
    },
  });
}
