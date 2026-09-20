import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getChildPointTotal } from "@/lib/points";
import { currentWeekStart, dateStrToUTCDate } from "@/lib/date";
import GoalEditor from "@/components/phu-huynh/GoalEditor";
import PointAdjustForm from "@/components/phu-huynh/PointAdjustForm";
import HistoryFilterForm from "@/components/phu-huynh/HistoryFilterForm";
import { personTheme } from "@/lib/personTheme";

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
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="mb-3 font-display text-xl font-bold">Lịch sử điểm &amp; Mục tiêu</h1>
        <div className="flex gap-1.5 rounded-2xl bg-white p-1.5 shadow-md">
          {children.map((c) => {
            const active = c.id === selected.id;
            const theme = personTheme(c.name);
            return (
              <Link
                key={c.id}
                href={`/phu-huynh/lich-su?child=${c.id}`}
                className="flex-1 rounded-xl py-2 text-center text-[13px] font-bold"
                style={active ? { background: theme.solid, color: "white" } : { color: "var(--color-muted)" }}
              >
                {c.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div
          className="rounded-[20px] p-4 text-white shadow-lg"
          style={{ background: "linear-gradient(150deg,#FFC93C,#FF9F45)" }}
        >
          <p className="text-[11.5px] font-bold uppercase tracking-wide opacity-90">Tổng điểm hiện tại</p>
          <p className="font-display text-[28px] font-extrabold">{total}</p>
        </div>
        <GoalEditor childId={selected.id} weekStart={weekStart} initialGoalText={goal?.goalText ?? ""} />
      </div>

      <PointAdjustForm childId={selected.id} />

      <HistoryFilterForm childId={selected.id} from={sp.from ?? ""} to={sp.to ?? ""} />

      <div className="rounded-2xl bg-white px-4 shadow-md">
        {entries.length === 0 ? (
          <p className="py-4 text-sm font-semibold text-muted">Không có mục nào.</p>
        ) : (
          <ul className="divide-y divide-divider">
            {entries.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-[13.5px] font-bold">{e.reason}</p>
                  <p className="text-[11.5px] font-semibold text-muted">
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
                  className="shrink-0 rounded-full px-3 py-1 text-[12.5px] font-extrabold"
                  style={
                    e.delta >= 0
                      ? { background: "var(--color-green-tint)", color: "var(--color-green-text)" }
                      : { background: "var(--color-divider)", color: "var(--color-muted)" }
                  }
                >
                  {e.delta > 0 ? `+${e.delta}` : e.delta}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
