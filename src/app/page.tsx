import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import LoginScreen from "@/components/LoginScreen";

export default async function HomePage() {
  const session = await getSession();
  if (session) {
    redirect(session.kind === "child" ? "/child" : "/phu-huynh");
  }

  const [children, parents] = await Promise.all([
    prisma.child.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.parent.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const people = [
    ...children.map((c) => ({ kind: "child" as const, id: c.id, name: c.name, label: c.label })),
    ...parents.map((p) => ({ kind: "parent" as const, id: p.id, name: p.name, label: p.label })),
  ];

  return <LoginScreen people={people} />;
}
