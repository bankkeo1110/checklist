import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOpenedDragonBallTier } from "@/lib/dragonball";
import Header from "@/components/Header";

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  const avatarTier =
    session.kind === "child"
      ? getOpenedDragonBallTier(
          (
            await prisma.dragonBallUnlock.findMany({ where: { childId: session.id }, select: { threshold: true } })
          ).map((u) => u.threshold),
        )
      : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-6">
      <Header name={session.label} caption="Tin nhắn gia đình 💬" personName={session.name} avatarEmoji={avatarTier?.emoji} />
      {children}
    </div>
  );
}
