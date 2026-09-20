import { prisma } from "@/lib/prisma";
import BedtimeItemManager from "@/components/phu-huynh/BedtimeItemManager";

export const dynamic = "force-dynamic";

export default async function BedtimeChecklistManagerPage() {
  const items = await prisma.bedtimeItem.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-xl font-bold">Checklist trước khi ngủ</h1>
      <p className="mb-3 text-sm font-semibold text-muted">Thêm, sửa, xóa các mục trong checklist buổi tối.</p>
      <BedtimeItemManager
        initialItems={items.map((i) => ({ id: i.id, label: i.label, active: i.active }))}
      />
    </div>
  );
}
