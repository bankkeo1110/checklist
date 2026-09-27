import { prisma } from "@/lib/prisma";
import TaskManager from "@/components/phu-huynh/TaskManager";
import SubjectItemManager from "@/components/phu-huynh/SubjectItemManager";

export const dynamic = "force-dynamic";

export default async function TaskManagerPage() {
  const [tasks, children, subjectItems] = await Promise.all([
    prisma.task.findMany({ include: { assignedTo: true }, orderBy: { createdAt: "asc" } }),
    prisma.child.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.subjectItem.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">Quản lý nhiệm vụ</h1>
        <p className="mb-3 text-sm font-semibold text-muted">Thêm, sửa, xóa nhiệm vụ tuần và giao cho con.</p>
        <TaskManager
          initialTasks={tasks.map((t) => ({
            id: t.id,
            title: t.title,
            points: t.points,
            active: t.active,
            childIds: t.assignedTo.map((c) => c.id),
          }))}
          kids={children.map((c) => ({ id: c.id, label: c.label, name: c.name }))}
        />
      </div>

      <section className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-[15px] font-bold">📚 Nhận xét của cô</h2>
          <p className="text-sm font-semibold text-muted">
            Các môn học cô nhận xét mỗi tuần — mỗi môn chỉ cần tích 1 lần/tuần, áp dụng chung cho cả hai con.
          </p>
        </div>
        <SubjectItemManager
          initialItems={subjectItems.map((i) => ({ id: i.id, label: i.label, points: i.points, active: i.active }))}
        />
      </section>
    </div>
  );
}
