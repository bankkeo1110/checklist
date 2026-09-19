import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getChildPointTotal } from "@/lib/points";
import { currentWeekStart, dateStrToUTCDate } from "@/lib/date";
import GoalEditor from "@/components/phu-huynh/GoalEditor";
import PointAdjustForm from "@/components/phu-huynh/PointAdjustForm";
import HistoryFilterForm from "@/components/phu-huynh/HistoryFilterForm";
import Corners from "@/components/Corners";

export const dynamic = "force-dynamic";

export default async function LichSuPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const children = await prisma.child.findMany({ orderBy: { createdAt: "asc" } });
  if (children.length === 0) return <p>Chưa có con nào.</p>;

  const selected = children.find((c) => c.id === sp.child) ?? children[0];

  const where: { childId: string; createdAt?: { gte?: Date; lte?: Date } } = { childId: selected.id };
  if (sp.from || sp.to) {
    where.createdAt = {};
    if (sp.from) where.createdAt.gte = new Date(`${sp.from}T00:00:00`);
    if (sp.to) where.createdAt.lte = new Date(`${sp.to}T23:59:59`);
  }

  const weekStart = currentWeekStart();
  const [entries, total, goal] = await Promise.all([
    prisma.pointLedger.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 }),
    getChildPointTotal(selected.id),
    prisma.weeklyGoal.findUnique({
      where: { childId_weekStart: { childId: selected.id, weekStart: dateStrToUTCDate(weekStart) } },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="mb-3 text-xl">Lịch sử điểm &amp; Mục tiêu</h1>
        <div className="inline-flex border border-divider">
          {children.map((c, i) => (
            <Link
              key={c.id}
              href={`/phu-huynh/lich-su?child=${c.id}`}
              className={`px-4 py-1.5 text-sm font-semibold ${
                c.id === selected.id ? "bg-accent-700 text-canvas" : "hover:bg-accent-100"
              } ${i > 0 ? "border-l border-divider" : ""}`}
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="blueprint relative border border-divider bg-surface p-4">
          <Corners />
          <p className="text-sm text-ink/60">Tổng điểm hiện tại</p>
          <p className="font-heading text-3xl font-bold text-accent-700">{total}</p>
        </div>
        <GoalEditor childId={selected.id} weekStart={weekStart} initialGoalText={goal?.goalText ?? ""} />
      </div>

      <PointAdjustForm childId={selected.id} />

      <HistoryFilterForm childId={selected.id} from={sp.from ?? ""} to={sp.to ?? ""} />

      <ul className="flex flex-col gap-2">
        {entries.length === 0 && <p className="text-sm text-ink/40">Không có mục nào.</p>}
        {entries.map((e) => (
          <li key={e.id} className="flex items-center justify-between border border-divider bg-surface px-4 py-2.5">
            <div>
              <p className="text-sm">{e.reason}</p>
              <p className="text-xs text-ink/40">
                {e.createdAt.toLocaleString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <span
              className={`shrink-0 px-2.5 py-1 text-sm font-bold ${
                e.delta >= 0 ? "bg-accent-100 text-accent-800" : "bg-neutral-100 text-neutral-800"
              }`}
            >
              {e.delta > 0 ? `+${e.delta}` : e.delta}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
