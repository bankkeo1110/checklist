import { prisma } from "@/lib/prisma";
import BedtimeItemManager from "@/components/phu-huynh/BedtimeItemManager";
import WakeupItemManager from "@/components/phu-huynh/WakeupItemManager";

export const dynamic = "force-dynamic";

export default async function DailyChecklistManagerPage() {
  const [bedtimeItems, wakeupItems] = await Promise.all([
    prisma.bedtimeItem.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.wakeupItem.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">Checklist hằng ngày</h1>
        <p className="text-sm font-semibold text-muted">Thêm, sửa, xóa các mục checklist buổi sáng và trước khi ngủ.</p>
      </div>

      <section className="flex flex-col gap-2.5">
        <h2 className="font-display text-[15px] font-bold">🌅 Checklist buổi sáng</h2>
        <WakeupItemManager
          initialItems={wakeupItems.map((i) => ({ id: i.id, label: i.label, active: i.active }))}
        />
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="font-display text-[15px] font-bold">🌙 Checklist trước khi ngủ</h2>
        <BedtimeItemManager
          initialItems={bedtimeItems.map((i) => ({ id: i.id, label: i.label, active: i.active }))}
        />
      </section>
    </div>
  );
}
