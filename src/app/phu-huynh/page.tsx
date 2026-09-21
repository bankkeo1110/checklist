import { prisma } from "@/lib/prisma";
import ApprovalInbox from "@/components/phu-huynh/ApprovalInbox";

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
      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        {children.map((child) => {
          const stars = starsByChild.get(child.id) ?? { approved: 0, pending: 0 };
          return (
            <div key={child.id} className="rounded-[20px] bg-white p-3.5 shadow-md">
              <p className="font-display text-[15px] font-bold">{child.label}</p>
              <div className="mt-1 flex gap-4 text-[12.5px] font-bold">
                <span className="text-green-text">⭐ {stars.approved} đã duyệt</span>
                <span className="text-orange">⭐ {stars.pending} chờ duyệt</span>
              </div>
            </div>
          );
        })}
      </div>
      <ApprovalInbox items={items} />
    </div>
  );
}
