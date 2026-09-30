import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getChildPointTotal } from "@/lib/points";
import { currentWeekStart, dateStrToUTCDate } from "@/lib/date";
import GoalEditor from "@/components/phu-huynh/GoalEditor";
import PointAdjustForm from "@/components/phu-huynh/PointAdjustForm";
import HistoryFilterForm from "@/components/phu-huynh/HistoryFilterForm";
import GrowthForm from "@/components/phu-huynh/GrowthForm";
import { personTheme } from "@/lib/personTheme";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function LichSuPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string; from?: string; to?: string; page?: string }>;
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
  const entryCount = await prisma.pointLedger.count({ where });
  const pageCount = Math.max(1, Math.ceil(entryCount / PAGE_SIZE));
  const page = Math.min(Math.max(Number.parseInt(sp.page ?? "1", 10) || 1, 1), pageCount);

  function pageHref(target: number) {
    const params = new URLSearchParams({ child: selected.id });
    if (sp.from) params.set("from", sp.from);
    if (sp.to) params.set("to", sp.to);
    if (target > 1) params.set("page", String(target));
    return `/phu-huynh/lich-su?${params.toString()}`;
  }

  const [entries, total, goal, latestGrowth] = await Promise.all([
    prisma.pointLedger.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    getChildPointTotal(selected.id),
    prisma.weeklyGoal.findUnique({
      where: { childId_weekStart: { childId: selected.id, weekStart: dateStrToUTCDate(weekStart) } },
    }),
    prisma.growthRecord.findFirst({
      where: { childId: selected.id },
      orderBy: { recordedAt: "desc" },
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

      <PointAdjustForm childId={selected.id} currentTotal={total} />

      <div className="flex flex-col gap-2 rounded-[20px] bg-white p-4 shadow-md">
        <p className="text-[11.5px] font-bold uppercase tracking-wide text-muted">Chiều cao / cân nặng</p>
        {latestGrowth ? (
          <div className="flex items-center gap-4">
            <span className="text-[15px] font-bold text-blue-text">📏 {latestGrowth.heightCm} cm</span>
            <span className="text-[15px] font-bold text-green-text">⚖️ {latestGrowth.weightKg} kg</span>
            <span className="text-[12px] font-semibold text-muted">
              ({latestGrowth.recordedAt.toLocaleDateString("vi-VN")})
            </span>
          </div>
        ) : (
          <p className="text-sm font-semibold text-muted">Chưa có số đo nào.</p>
        )}
      </div>
      <GrowthForm childId={selected.id} latestHeightCm={latestGrowth?.heightCm ?? null} latestWeightKg={latestGrowth?.weightKg ?? null} />

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

      {pageCount > 1 && (
        <nav className="flex items-center justify-between gap-2" aria-label="Phân trang">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="rounded-xl bg-white px-4 py-2 text-[13px] font-bold text-blue-text shadow-md">
              ← Mới hơn
            </Link>
          ) : (
            <span />
          )}
          <span className="text-[13px] font-semibold text-muted">
            Trang {page}/{pageCount} · {entryCount} mục
          </span>
          {page < pageCount ? (
            <Link href={pageHref(page + 1)} className="rounded-xl bg-white px-4 py-2 text-[13px] font-bold text-blue-text shadow-md">
              Cũ hơn →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
