import { prisma } from "@/lib/prisma";
import BedtimeItemManager from "@/components/phu-huynh/BedtimeItemManager";

export const dynamic = "force-dynamic";

export default async function BedtimeChecklistManagerPage() {
  const items = await prisma.bedtimeItem.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-slate-800">Checklist trước khi ngủ</h1>
      <p className="mb-5 text-sm text-slate-500">Thêm, sửa, xóa các mục trong checklist buổi tối.</p>
      <BedtimeItemManager
        initialItems={items.map((i) => ({ id: i.id, label: i.label, active: i.active }))}
      />
    </div>
  );
}
