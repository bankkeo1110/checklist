import Link from "next/link";
import { Fragment } from "react";
import { prisma } from "@/lib/prisma";
import { weekdayLabel } from "@/lib/date";
import { getChildDashboardData } from "@/lib/childDashboard";
import { ANIMAL_TIERS } from "@/lib/animals";
import { DRAGON_BALL_TIERS } from "@/lib/dragonball";
import { personTheme } from "@/lib/personTheme";
import TaskStatusCell from "@/components/child/TaskStatusCell";
import Stars from "@/components/Stars";

export const dynamic = "force-dynamic";

type Item = { id: string; label: string; points: number };

// Read-only week grid for self-check items (checklist buổi sáng/tối) — same
// checked/day-cell shape as the interactive SelfCheckGrid, minus every
// button/handler, since a parent is only viewing here, not acting.
function ReadOnlySelfCheckGrid({
  items,
  dates,
  today,
  checkedMap,
  accent,
}: {
  items: Item[];
  dates: string[];
  today: string;
  checkedMap: Record<string, Record<string, boolean>>;
  accent: "orange" | "blue";
}) {
  const border = accent === "orange" ? "border-orange" : "border-blue";
  const bg = accent === "orange" ? "bg-orange" : "bg-blue";
  const text = accent === "orange" ? "text-orange" : "text-blue";

  if (items.length === 0) {
    return <p className="text-sm font-semibold text-muted">Chưa có mục nào trong checklist.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-[22px] bg-white p-3.5 shadow-md">
      <div className="grid min-w-[560px] grid-cols-[max-content_repeat(7,minmax(38px,1fr))] gap-x-2 gap-y-2">
        <div />
        {dates.map((d) => (
          <div key={d} className={`text-center font-display text-[11.5px] font-bold ${d === today ? text : "text-muted"}`}>
            {weekdayLabel(d)}
          </div>
        ))}
        {items.map((item) => (
          <Fragment key={item.id}>
            <div className="flex items-center gap-1.5 whitespace-nowrap pr-2 text-[12.5px] font-bold">
              <span>{item.label}</span>
              <Stars count={item.points} size={11} />
            </div>
            {dates.map((d) => {
              const checked = checkedMap[item.id]?.[d] ?? false;
              const isFuture = d > today;
              return (
                <div key={`${item.id}-${d}`} className="flex justify-center">
                  {isFuture ? (
                    <span className="flex h-[38px] w-[38px] items-center justify-center rounded-lg bg-[#f7f5f9] text-[14px] text-[#e4e1e8]">·</span>
                  ) : checked ? (
                    <span className={`flex h-[38px] w-[38px] items-center justify-center rounded-lg border-2 ${border} ${bg} text-white`}>✓</span>
                  ) : (
                    <span className="flex h-[38px] w-[38px] items-center justify-center rounded-lg border-2 border-[#e4e1e8] bg-white" />
                  )}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function ReadOnlyTierRow({ tiers, openedThresholds }: { tiers: { threshold: number; emoji: string; name: string }[]; openedThresholds: number[] }) {
  const openedSet = new Set(openedThresholds);
  const openedTiers = tiers.filter((t) => openedSet.has(t.threshold));
  const current = openedTiers.length ? openedTiers[openedTiers.length - 1] : null;

  return (
    <div className="flex flex-col gap-3 rounded-[22px] bg-white p-4 shadow-md">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl text-[28px]" style={{ background: "var(--color-green-tint)" }}>
          {current ? current.emoji : "🥚"}
        </span>
        <p className="font-display text-[14px] font-bold">{current ? current.name : "Chưa mở con nào"}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {tiers.map((t) => {
          const opened = openedSet.has(t.threshold);
          return (
            <div key={t.threshold} className="flex w-[40px] flex-none flex-col items-center gap-1">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl text-[16px] ${opened ? "" : "opacity-40 grayscale"}`}
                style={{ background: opened ? "var(--color-green-tint)" : "var(--color-divider)" }}
              >
                {opened ? t.emoji : "🔒"}
              </span>
              <span className="text-[10px] font-bold text-muted">{t.threshold}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default async function TinhTrangPage({ searchParams }: { searchParams: Promise<{ child?: string }> }) {
  const sp = await searchParams;
  const children = await prisma.child.findMany({ orderBy: { createdAt: "asc" } });
  if (children.length === 0) return <p>Chưa có con nào.</p>;

  const selected = children.find((c) => c.id === sp.child) ?? children[0];
  const data = await getChildDashboardData(selected.id);

  const tasksForGrid = data.tasks.map((t) => ({ id: t.id, title: t.title, points: t.points }));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="mb-3 font-display text-xl font-bold">Tình trạng con</h1>
        <div className="flex gap-1.5 rounded-2xl bg-white p-1.5 shadow-md">
          {children.map((c) => {
            const active = c.id === selected.id;
            const theme = personTheme(c.name);
            return (
              <Link
                key={c.id}
                href={`/phu-huynh/tinh-trang?child=${c.id}`}
                className="flex-1 rounded-xl py-2 text-center text-[13px] font-bold"
                style={active ? { background: theme.solid, color: "white" } : { color: "var(--color-muted)" }}
              >
                {c.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 rounded-[22px] p-4 text-white shadow-lg" style={{ background: "linear-gradient(150deg,#FFC93C,#FF9F45)" }}>
          <p className="text-xs font-bold uppercase tracking-wide opacity-90">Tổng điểm</p>
          <p className="font-display text-[28px] font-extrabold leading-tight">⭐ {data.pointTotal}</p>
        </div>
        {data.goal?.goalText && (
          <div className="flex-1 rounded-[22px] bg-white p-4 shadow-md">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Mục tiêu tuần</p>
            <p className="mt-1 text-[13.5px] font-bold">{data.goal.goalText}</p>
          </div>
        )}
        {data.latestGrowth && (
          <div className="flex-1 rounded-[22px] bg-white p-4 shadow-md">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Chiều cao / cân nặng</p>
            <p className="mt-1 text-[13.5px] font-bold">
              📏 {data.latestGrowth.heightCm} cm · ⚖️ {data.latestGrowth.weightKg} kg
            </p>
          </div>
        )}
      </div>

      <section className="flex flex-col gap-2.5">
        <h2 className="font-display text-[15px] font-bold">🐾 Bộ sưu tập thú cưng</h2>
        <ReadOnlyTierRow tiers={ANIMAL_TIERS} openedThresholds={data.animalUnlockedThresholds} />
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="font-display text-[15px] font-bold">🐉 Cấp độ Dragon Ball</h2>
        <ReadOnlyTierRow tiers={DRAGON_BALL_TIERS} openedThresholds={data.dragonBallUnlockedThresholds} />
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="font-display text-[15px] font-bold">🌅 Checklist buổi sáng</h2>
        <ReadOnlySelfCheckGrid
          items={data.wakeupItems.map((i) => ({ id: i.id, label: i.label, points: i.points }))}
          dates={data.dates}
          today={data.today}
          checkedMap={data.wakeupCheckedMap}
          accent="orange"
        />
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="font-display text-[15px] font-bold">🎯 Nhiệm vụ tuần</h2>
        {tasksForGrid.length === 0 ? (
          <p className="text-sm font-semibold text-muted">Chưa có nhiệm vụ nào được giao.</p>
        ) : (
          <div className="overflow-x-auto rounded-[22px] bg-white p-3.5 shadow-md">
            <div className="grid min-w-[560px] grid-cols-[max-content_repeat(7,minmax(38px,1fr))] gap-x-2 gap-y-2">
              <div />
              {data.dates.map((d) => (
                <div key={d} className={`text-center font-display text-[11.5px] font-bold ${d === data.today ? "text-orange" : "text-muted"}`}>
                  {weekdayLabel(d)}
                </div>
              ))}
              {tasksForGrid.map((task) => (
                <Fragment key={task.id}>
                  <div className="flex items-center gap-1.5 whitespace-nowrap pr-2 text-[12.5px] font-bold">
                    <span>{task.title}</span>
                    <Stars count={task.points} size={11} />
                  </div>
                  {data.dates.map((d) => {
                    const isFuture = d > data.today;
                    const cell = data.cellsByTask[task.id]?.[d];
                    return (
                      <div key={`${task.id}-${d}`} className="flex justify-center">
                        {isFuture ? (
                          <span className="flex h-[38px] w-[38px] items-center justify-center rounded-lg bg-[#f7f5f9] text-[14px] text-[#e4e1e8]">·</span>
                        ) : (
                          <TaskStatusCell status={cell?.status ?? "MISSED"} />
                        )}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="font-display text-[15px] font-bold">📚 Nhận xét của cô</h2>
        {data.subjectItems.length === 0 ? (
          <p className="text-sm font-semibold text-muted">Chưa có môn nào trong nhận xét tuần này.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-2">
            {data.subjectItems.map((item) => {
              const checked = data.subjectCheckedMap[item.id] ?? false;
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-3 shadow-md"
                >
                  <span
                    className={`flex h-[22px] w-[22px] flex-none items-center justify-center rounded-lg border-2 ${
                      checked ? "border-purple bg-purple text-white" : "border-[#e4e1e8]"
                    }`}
                  >
                    {checked && "✓"}
                  </span>
                  <span className={`min-w-0 flex-1 truncate text-[13.5px] font-bold ${checked ? "text-muted line-through" : ""}`}>
                    {item.label}
                  </span>
                  <Stars count={item.points} size={11} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="font-display text-[15px] font-bold">🌙 Checklist trước khi đi ngủ</h2>
        <ReadOnlySelfCheckGrid
          items={data.bedtimeItems.map((i) => ({ id: i.id, label: i.label, points: i.points }))}
          dates={data.dates}
          today={data.today}
          checkedMap={data.bedtimeCheckedMap}
          accent="blue"
        />
      </section>
    </div>
  );
}
