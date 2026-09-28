import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { FAMILY_TITLE, getMembership, getMessages, listPeople, sessionKind } from "@/lib/chat";
import ChatRoom from "@/components/chat/ChatRoom";
import ChatAvatar from "@/components/chat/ChatAvatar";

export const dynamic = "force-dynamic";

export default async function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return null;
  const { id } = await params;

  if (!(await getMembership(id, session))) notFound();

  const [conversation, people, messages] = await Promise.all([
    prisma.conversation.findUnique({ where: { id }, include: { members: true } }),
    listPeople(),
    getMessages(id, session),
  ]);
  if (!conversation) notFound();

  const isGroup = !conversation.directKey;
  const kind = sessionKind(session);
  const memberPeople = conversation.members
    .map((m) => people.find((p) => p.kind === m.kind && p.id === m.personId))
    .filter((p) => p !== undefined);
  const other = isGroup ? null : memberPeople.find((p) => !(p.kind === kind && p.id === session.id));

  const title = isGroup ? (conversation.title ?? FAMILY_TITLE) : (other?.label ?? "Trò chuyện");
  const subtitle = isGroup ? memberPeople.map((p) => p.label).join(", ") : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <Link
          href="/chat"
          aria-label="Quay lại danh sách"
          className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-xl bg-white text-muted shadow-md"
        >
          <ChevronLeft size={18} />
        </Link>
        <ChatAvatar avatarName={isGroup ? null : (other?.name ?? null)} size={36} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-[17px] font-bold">{title}</h1>
          {subtitle && <p className="truncate text-xs font-semibold text-muted">{subtitle}</p>}
        </div>
      </div>
      <ChatRoom conversationId={id} isGroup={isGroup} initialMessages={messages} />
    </div>
  );
}
