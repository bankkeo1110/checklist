import { prisma } from "@/lib/prisma";
import ApprovalInbox from "@/components/phu-huynh/ApprovalInbox";

export const dynamic = "force-dynamic";

export default async function PhuHuynhInboxPage() {
  const pending = await prisma.taskInstance.findMany({
    where: { status: "CLAIMED" },
    include: { task: true, child: true },
    orderBy: { claimedAt: "asc" },
  });

  const items = pending.map((p) => ({
    id: p.id,
    taskTitle: p.task.title,
    points: p.task.points,
    childName: p.child.name,
    childLabel: p.child.label,
  }));

  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-xl font-bold">Chờ duyệt</h1>
      <p className="mb-3 text-sm font-semibold text-muted">
        {items.length === 0 ? "Không có mục nào đang chờ." : `${items.length} mục đang chờ duyệt, cũ nhất trước.`}
      </p>
      <ApprovalInbox items={items} />
    </div>
  );
}
