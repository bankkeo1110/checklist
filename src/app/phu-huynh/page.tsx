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
    <div>
      <h1 className="mb-1 text-xl">Chờ duyệt</h1>
      <p className="mb-5 text-sm text-ink/60">
        {items.length === 0 ? "Không có mục nào đang chờ." : `${items.length} mục đang chờ duyệt, cũ nhất trước.`}
      </p>
      <ApprovalInbox items={items} />
    </div>
  );
}
