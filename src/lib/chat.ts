import type { PersonKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/auth";

export const FAMILY_SLUG = "family";
export const FAMILY_TITLE = "Cả nhà 🏠";
export const MAX_MESSAGE_LENGTH = 1000;

export type ChatPerson = { kind: PersonKind; id: string; name: string; label: string };

export type ChatMessageView = {
  id: string;
  body: string;
  createdAt: string;
  senderName: string;
  senderLabel: string;
  mine: boolean;
};

export type InboxRow = {
  key: string;
  conversationId: string | null;
  title: string;
  /** Person name (OTIS, TINH…) for the badge; null for the family group. */
  avatarName: string | null;
  /** For a 1-1 chat that hasn't been started yet. */
  target: { kind: PersonKind; id: string } | null;
  lastMessage: { body: string; senderLabel: string; createdAt: string; mine: boolean } | null;
  unread: number;
};

export function sessionKind(session: SessionPayload): PersonKind {
  return session.kind === "child" ? "CHILD" : "PARENT";
}

function personKey(kind: PersonKind, id: string) {
  return `${kind}:${id}`;
}

export function directKey(a: { kind: PersonKind; id: string }, b: { kind: PersonKind; id: string }) {
  return [personKey(a.kind, a.id), personKey(b.kind, b.id)].sort().join("|");
}

export async function listPeople(): Promise<ChatPerson[]> {
  const [children, parents] = await Promise.all([
    prisma.child.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.parent.findMany({ orderBy: { createdAt: "asc" } }),
  ]);
  return [
    ...parents.map((p) => ({ kind: "PARENT" as const, id: p.id, name: p.name, label: p.label })),
    ...children.map((c) => ({ kind: "CHILD" as const, id: c.id, name: c.name, label: c.label })),
  ];
}

/** Creates the default family group if needed and adds anyone missing (the test account stays out). */
export async function ensureFamilyGroup(people: ChatPerson[]) {
  const family = await prisma.conversation.upsert({
    where: { slug: FAMILY_SLUG },
    update: {},
    create: { slug: FAMILY_SLUG, title: FAMILY_TITLE },
  });
  await prisma.conversationMember.createMany({
    data: people
      .filter((p) => p.name !== "TEST")
      .map((p) => ({ conversationId: family.id, kind: p.kind, personId: p.id })),
    skipDuplicates: true,
  });
  return family;
}

export async function getOrCreateDirect(me: { kind: PersonKind; id: string }, other: { kind: PersonKind; id: string }) {
  const key = directKey(me, other);
  const conversation = await prisma.conversation.upsert({
    where: { directKey: key },
    update: {},
    create: { directKey: key },
  });
  await prisma.conversationMember.createMany({
    data: [me, other].map((p) => ({ conversationId: conversation.id, kind: p.kind, personId: p.id })),
    skipDuplicates: true,
  });
  return conversation;
}

export async function getMembership(conversationId: string, session: SessionPayload) {
  return prisma.conversationMember.findUnique({
    where: {
      conversationId_kind_personId: { conversationId, kind: sessionKind(session), personId: session.id },
    },
  });
}

function unreadWhere(conversationId: string, lastReadAt: Date, kind: PersonKind, id: string) {
  return {
    conversationId,
    createdAt: { gt: lastReadAt },
    NOT: { senderKind: kind, senderId: id },
  };
}

export async function getUnreadTotal(session: SessionPayload): Promise<number> {
  const kind = sessionKind(session);
  const memberships = await prisma.conversationMember.findMany({ where: { kind, personId: session.id } });
  const counts = await Promise.all(
    memberships.map((m) => prisma.chatMessage.count({ where: unreadWhere(m.conversationId, m.lastReadAt, kind, session.id) })),
  );
  return counts.reduce((a, b) => a + b, 0);
}

export async function getInbox(session: SessionPayload): Promise<InboxRow[]> {
  const kind = sessionKind(session);
  const me = { kind, id: session.id };
  const people = await listPeople();
  await ensureFamilyGroup(people);

  const labelByKey = new Map(people.map((p) => [personKey(p.kind, p.id), p.label]));
  const memberships = await prisma.conversationMember.findMany({
    where: { kind, personId: session.id },
    include: { conversation: { include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } } } },
  });
  const unreadCounts = await Promise.all(
    memberships.map((m) => prisma.chatMessage.count({ where: unreadWhere(m.conversationId, m.lastReadAt, kind, session.id) })),
  );

  function rowFor(index: number) {
    const m = memberships[index];
    const last = m.conversation.messages[0];
    return {
      conversationId: m.conversationId,
      lastMessage: last
        ? {
            body: last.body,
            senderLabel: labelByKey.get(personKey(last.senderKind, last.senderId)) ?? "?",
            createdAt: last.createdAt.toISOString(),
            mine: last.senderKind === kind && last.senderId === session.id,
          }
        : null,
      unread: unreadCounts[index],
    };
  }

  const rows: InboxRow[] = [];
  const familyIndex = memberships.findIndex((m) => m.conversation.slug === FAMILY_SLUG);
  if (familyIndex >= 0) {
    rows.push({
      key: FAMILY_SLUG,
      title: memberships[familyIndex].conversation.title ?? FAMILY_TITLE,
      avatarName: null,
      target: null,
      ...rowFor(familyIndex),
    });
  }

  const directRows: InboxRow[] = [];
  for (const person of people) {
    if (person.kind === kind && person.id === session.id) continue;
    const key = directKey(me, person);
    const index = memberships.findIndex((m) => m.conversation.directKey === key);
    directRows.push({
      key,
      title: person.label,
      avatarName: person.name,
      target: index >= 0 ? null : { kind: person.kind, id: person.id },
      ...(index >= 0 ? rowFor(index) : { conversationId: null, lastMessage: null, unread: 0 }),
    });
  }
  // Most recent chats first; people never messaged keep their natural order at the end.
  directRows.sort((a, b) => (b.lastMessage?.createdAt ?? "").localeCompare(a.lastMessage?.createdAt ?? ""));

  return [...rows, ...directRows];
}

export async function getMessages(
  conversationId: string,
  session: SessionPayload,
  options: { after?: Date; take?: number } = {},
): Promise<ChatMessageView[]> {
  const kind = sessionKind(session);
  const people = await listPeople();
  const byKey = new Map(people.map((p) => [personKey(p.kind, p.id), p]));

  const messages = options.after
    ? await prisma.chatMessage.findMany({
        where: { conversationId, createdAt: { gt: options.after } },
        orderBy: { createdAt: "asc" },
      })
    : (
        await prisma.chatMessage.findMany({
          where: { conversationId },
          orderBy: { createdAt: "desc" },
          take: options.take ?? 100,
        })
      ).reverse();

  return messages.map((m) => {
    const sender = byKey.get(personKey(m.senderKind, m.senderId));
    return {
      id: m.id,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      senderName: sender?.name ?? "",
      senderLabel: sender?.label ?? "?",
      mine: m.senderKind === kind && m.senderId === session.id,
    };
  });
}

export async function markRead(conversationId: string, session: SessionPayload) {
  await prisma.conversationMember.update({
    where: {
      conversationId_kind_personId: { conversationId, kind: sessionKind(session), personId: session.id },
    },
    data: { lastReadAt: new Date() },
  });
}
