import { prisma } from "@/lib/prisma";
import TaskManager from "@/components/phu-huynh/TaskManager";

export const dynamic = "force-dynamic";

export default async function TaskManagerPage() {
  const [tasks, children] = await Promise.all([
    prisma.task.findMany({ include: { assignedTo: true }, orderBy: { createdAt: "asc" } }),
    prisma.child.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-slate-800">Quản lý nhiệm vụ</h1>
      <p className="mb-5 text-sm text-slate-500">Thêm, sửa, xóa nhiệm vụ tuần và giao cho con.</p>
      <TaskManager
        initialTasks={tasks.map((t) => ({
          id: t.id,
          title: t.title,
          points: t.points,
          active: t.active,
          childIds: t.assignedTo.map((c) => c.id),
        }))}
        kids={children.map((c) => ({ id: c.id, label: c.label, color: c.color }))}
      />
    </div>
  );
}
