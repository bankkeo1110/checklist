import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOpenedDragonBallTier } from "@/lib/dragonball";
import Header from "@/components/Header";
import ChatDock from "@/components/chat/ChatDock";
import ChildNav from "@/components/child/ChildNav";

export default async function ChildLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.kind !== "child") {
    redirect("/");
  }

  const dragonBallUnlocks = await prisma.dragonBallUnlock.findMany({
    where: { childId: session.id },
    select: { threshold: true },
  });
  const avatarTier = getOpenedDragonBallTier(dragonBallUnlocks.map((u) => u.threshold));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">
      <Header
        name={session.label}
        caption="Chào mừng trở lại! 🎈"
        personName={session.name}
        avatarEmoji={avatarTier?.emoji}
      />
      <ChildNav />
      {children}
      <ChatDock />
    </div>
  );
}
