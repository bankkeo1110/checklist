import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getOpenedDragonBallTier } from "@/lib/dragonball";
import LoginScreen from "@/components/LoginScreen";

export default async function HomePage() {
  const session = await getSession();
  if (session) {
    redirect(session.kind === "child" ? "/child" : "/phu-huynh");
  }

  const [children, parents, dragonBallUnlocks] = await Promise.all([
    prisma.child.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.parent.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.dragonBallUnlock.findMany({ select: { childId: true, threshold: true } }),
  ]);

  const unlockedByChild = new Map<string, number[]>();
  for (const u of dragonBallUnlocks) {
    const list = unlockedByChild.get(u.childId) ?? [];
    list.push(u.threshold);
    unlockedByChild.set(u.childId, list);
  }

  const people = [
    ...children.map((c) => ({
      kind: "child" as const,
      id: c.id,
      name: c.name,
      label: c.label,
      avatarEmoji: getOpenedDragonBallTier(unlockedByChild.get(c.id) ?? [])?.emoji,
    })),
    ...parents.map((p) => ({ kind: "parent" as const, id: p.id, name: p.name, label: p.label })),
  ];

  return <LoginScreen people={people} />;
}
