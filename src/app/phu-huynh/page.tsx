import { prisma } from "@/lib/prisma";
import ApprovalInbox from "@/components/phu-huynh/ApprovalInbox";
import ParentDashboard from "@/components/phu-huynh/ParentDashboard";

export const dynamic = "force-dynamic";

export default async function PhuHuynhInboxPage() {
  const [pending, children, trackedInstances] = await Promise.all([
    prisma.taskInstance.findMany({
      where: { status: "CLAIMED" },
      include: { task: true, child: true },
      orderBy: { claimedAt: "asc" },
    }),
    prisma.child.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.taskInstance.findMany({
      where: { status: { in: ["CLAIMED", "APPROVED"] } },
      select: { childId: true, status: true, task: { select: { points: true } } },
    }),
  ]);

  const items = pending.map((p) => ({
    id: p.id,
    taskTitle: p.task.title,
    points: p.task.points,
    childName: p.child.name,
    childLabel: p.child.label,
  }));

  const starsByChild = new Map<string, { approved: number; pending: number }>();
  for (const child of children) starsByChild.set(child.id, { approved: 0, pending: 0 });
  for (const instance of trackedInstances) {
    const stars = starsByChild.get(instance.childId);
    if (!stars) continue;
    stars[instance.status === "APPROVED" ? "approved" : "pending"] += instance.task.points;
  }

  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-xl font-bold">Chờ duyệt</h1>
      <p className="mb-3 text-sm font-semibold text-muted">
        {items.length === 0 ? "Không có mục nào đang chờ." : `${items.length} mục đang chờ duyệt, cũ nhất trước.`}
      </p>
      <ParentDashboard
        children={children.map((child) => ({
          id: child.id,
          label: child.label,
          approved: starsByChild.get(child.id)?.approved ?? 0,
          pending: starsByChild.get(child.id)?.pending ?? 0,
        }))}
      />
      <ApprovalInbox items={items} />
    </div>
  );
}
