import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getChildPointTotal } from "@/lib/points";
import { addDaysToDateStr, dateStrFromDate, dateStrToUTCDate, todayDateStr, weekStartForDateStr } from "@/lib/date";
import { summarizePointHistory, type PointSummaryRow } from "@/lib/pointSummary";
import { personTheme } from "@/lib/personTheme";
import WeeklyResetButton from "@/components/phu-huynh/WeeklyResetButton";

export const dynamic = "force-dynamic";

// Bounded lookback so this page doesn't fetch an ever-growing ledger as
// history accumulates over years.
const LOOKBACK_DAYS = 365 * 2;
const RECENT_WEEKS_SHOWN = 12;

function weekRangeLabel(weekStart: string): string {
  const [, m1, d1] = weekStart.split("-");
  const weekEnd = addDaysToDateStr(weekStart, 6);
  const [y2, m2, d2] = weekEnd.split("-");
  return `Tuần ${d1}/${m1} – ${d2}/${m2}/${y2}`;
}

function SummarySection({
  title,
  rows,
  hrefForKey,
}: {
  title: string;
  rows: PointSummaryRow[];
  hrefForKey?: (key: string) => string;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="font-display text-[15px] font-bold">{title}</h2>
      <div className="rounded-2xl bg-white px-4 shadow-md">
        {rows.length === 0 ? (
          <p className="py-4 text-sm font-semibold text-muted">Chưa có dữ liệu.</p>
        ) : (
          <ul className="divide-y divide-divider">
            {rows.map((r) => {
              const badge = (
                <span
                  className="shrink-0 rounded-full px-3 py-1 text-[12.5px] font-extrabold"
                  style={
                    r.total >= 0
                      ? { background: "var(--color-green-tint)", color: "var(--color-green-text)" }
                      : { background: "var(--color-divider)", color: "var(--color-muted)" }
                  }
                >
                  {r.total > 0 ? `+${r.total}` : r.total}
                </span>
              );
              return (
                <li key={r.key} className="py-2.5">
                  {hrefForKey ? (
                    <Link href={hrefForKey(r.key)} className="flex items-center justify-between">
                      <span className="text-[13.5px] font-bold">{r.label}</span>
                      {badge}
                    </Link>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-[13.5px] font-bold">{r.label}</span>
                      {badge}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

export default async function TongKetPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string; week?: string }>;
}) {
  const sp = await searchParams;
  const children = await prisma.child.findMany({ orderBy: { createdAt: "asc" } });
  if (children.length === 0) return <p>Chưa có con nào.</p>;

  const selected = children.find((c) => c.id === sp.child) ?? children[0];

  const [currentTotal, allEntries] = await Promise.all([
    getChildPointTotal(selected.id),
    prisma.pointLedger.findMany({
      where: { childId: selected.id, createdAt: { gte: dateStrToUTCDate(addDaysToDateStr(todayDateStr(), -LOOKBACK_DAYS)) } },
      orderBy: { createdAt: "desc" },
      select: { id: true, delta: true, reason: true, createdAt: true },
    }),
  ]);

  const summary = summarizePointHistory(allEntries);

  const selectedWeek = sp.week && /^\d{4}-\d{2}-\d{2}$/.test(sp.week) ? sp.week : null;
  const weekEntries = selectedWeek
    ? allEntries.filter((e) => weekStartForDateStr(dateStrFromDate(e.createdAt)) === selectedWeek)
    : [];

  function hrefFor(childId: string, weekKey: string | null) {
    const params = new URLSearchParams({ child: childId });
    if (weekKey) params.set("week", weekKey);
    return `/phu-huynh/tong-ket?${params.toString()}`;
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="mb-3 font-display text-xl font-bold">Tổng kết điểm</h1>
        <div className="flex gap-1.5 rounded-2xl bg-white p-1.5 shadow-md">
          {children.map((c) => {
            const active = c.id === selected.id;
            const theme = personTheme(c.name);
            return (
              <Link
                key={c.id}
                href={hrefFor(c.id, null)}
                className="flex-1 rounded-xl py-2 text-center text-[13px] font-bold"
                style={active ? { background: theme.solid, color: "white" } : { color: "var(--color-muted)" }}
              >
                {c.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div
        className="rounded-[20px] p-4 text-white shadow-lg"
        style={{ background: "linear-gradient(150deg,#FFC93C,#FF9F45)" }}
      >
        <p className="text-[11.5px] font-bold uppercase tracking-wide opacity-90">Tổng điểm hiện tại</p>
        <p className="font-display text-[28px] font-extrabold">{currentTotal}</p>
      </div>

      <WeeklyResetButton childId={selected.id} currentTotal={currentTotal} />

      {selectedWeek ? (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[15px] font-bold">{weekRangeLabel(selectedWeek)}</h2>
            <Link href={hrefFor(selected.id, null)} className="text-[12.5px] font-bold text-blue-text">
              ← Về tổng kết
            </Link>
          </div>
          <div className="rounded-2xl bg-white px-4 shadow-md">
            {weekEntries.length === 0 ? (
              <p className="py-4 text-sm font-semibold text-muted">Không có mục nào tuần này.</p>
            ) : (
              <ul className="divide-y divide-divider">
                {weekEntries.map((e) => (
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
      ) : (
        <>
          <SummarySection
            title="Theo tuần"
            rows={summary.weeks.slice(0, RECENT_WEEKS_SHOWN)}
            hrefForKey={(k) => hrefFor(selected.id, k)}
          />
          <SummarySection title="Theo tháng" rows={summary.months} />
          <SummarySection title="Theo quý" rows={summary.quarters} />
          <SummarySection title="Theo năm" rows={summary.years} />
        </>
      )}
    </div>
  );
}
