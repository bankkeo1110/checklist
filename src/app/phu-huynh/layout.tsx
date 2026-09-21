import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Header from "@/components/Header";
import ParentNav from "@/components/phu-huynh/ParentNav";
import ParentDashboard from "@/components/phu-huynh/ParentDashboard";
import { prisma } from "@/lib/prisma";

export default async function PhuHuynhLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.kind !== "parent") {
    redirect("/");
  }

  const [children, trackedInstances] = await Promise.all([
    prisma.child.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.taskInstance.findMany({
      where: { status: { in: ["CLAIMED", "APPROVED"] } },
      select: { childId: true, status: true, task: { select: { points: true } } },
    }),
  ]);
  const starsByChild = new Map<string, { approved: number; pending: number }>();
  for (const child of children) starsByChild.set(child.id, { approved: 0, pending: 0 });
  for (const instance of trackedInstances) {
    const stars = starsByChild.get(instance.childId);
    if (!stars) continue;
    stars[instance.status === "APPROVED" ? "approved" : "pending"] += instance.task.points;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-6">
      <Header name={session.label} caption="Bảng điều khiển phụ huynh" personName={session.name} />
      <ParentDashboard
        children={children.map((child) => ({
          id: child.id,
          label: child.label,
          approved: starsByChild.get(child.id)?.approved ?? 0,
          pending: starsByChild.get(child.id)?.pending ?? 0,
        }))}
      />
      <ParentNav />
      {children}
    </div>
  );
}
