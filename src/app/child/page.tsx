import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reconcileMissedDaysForChild } from "@/lib/reconcile";
import { getChildPointTotal } from "@/lib/points";
import { currentWeekStart, dateStrToUTCDate, todayDateStr, weekDates } from "@/lib/date";
import WeeklyGrid from "@/components/child/WeeklyGrid";
import BedtimeChecklist from "@/components/child/BedtimeChecklist";
import PointHistoryStrip from "@/components/child/PointHistoryStrip";

export const dynamic = "force-dynamic";

export default async function ConPage() {
  const session = await getSession();
  if (!session || session.kind !== "child") return null;

  await reconcileMissedDaysForChild(session.id);

  const weekStart = currentWeekStart();
  const dates = weekDates(weekStart);
  const today = todayDateStr();

  const [tasks, instances, bedtimeItems, bedtimeLogs, pointTotal, goal, history] = await Promise.all([
    prisma.task.findMany({
      where: { active: true, assignedTo: { some: { id: session.id } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.taskInstance.findMany({
      where: {
        childId: session.id,
        date: { gte: dateStrToUTCDate(dates[0]), lte: dateStrToUTCDate(dates[6]) },
      },
    }),
    prisma.bedtimeItem.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.bedtimeLog.findMany({
      where: { childId: session.id, date: dateStrToUTCDate(today) },
    }),
    getChildPointTotal(session.id),
    prisma.weeklyGoal.findUnique({
      where: { childId_weekStart: { childId: session.id, weekStart: dateStrToUTCDate(weekStart) } },
    }),
    prisma.pointLedger.findMany({
      where: { childId: session.id },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const cellsByTask: Record<string, Record<string, { id: string; status: string }>> = {};
  for (const instance of instances) {
    const dateStr = instance.date.toISOString().slice(0, 10);
    cellsByTask[instance.taskId] ??= {};
    cellsByTask[instance.taskId][dateStr] = { id: instance.id, status: instance.status };
  }

  const checkedMap: Record<string, boolean> = {};
  for (const log of bedtimeLogs) {
    checkedMap[log.bedtimeItemId] = log.checked;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-3">
        <div
          className="flex-1 rounded-[22px] p-4 text-white shadow-lg"
          style={{ background: "linear-gradient(150deg,#FFC93C,#FF9F45)" }}
        >
          <p className="text-xs font-bold uppercase tracking-wide opacity-90">Tổng điểm</p>
          <p className="font-display text-[34px] font-extrabold leading-tight">⭐ {pointTotal}</p>
        </div>
        {goal?.goalText && (
          <div className="flex-1 rounded-[22px] bg-white p-4 shadow-md">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Mục tiêu tuần</p>
            <p className="mt-1 text-[14.5px] font-bold">{goal.goalText}</p>
          </div>
        )}
      </div>

      <section className="flex flex-col gap-2.5">
        <h2 className="font-display text-[15px] font-bold">🎯 Nhiệm vụ tuần</h2>
        <WeeklyGrid
          tasks={tasks.map((t) => ({
            id: t.id,
            title: t.title,
            points: t.points,
            createdAtDate: t.createdAt.toISOString().slice(0, 10),
          }))}
          dates={dates}
          today={today}
          cellsByTask={cellsByTask}
        />
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="font-display text-[15px] font-bold">🌙 Checklist trước khi đi ngủ</h2>
        <BedtimeChecklist
          items={bedtimeItems.map((i) => ({ id: i.id, label: i.label }))}
          checkedMap={checkedMap}
        />
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="font-display text-[15px] font-bold">📋 Gần đây</h2>
        <PointHistoryStrip
          entries={history.map((h) => ({
            id: h.id,
            delta: h.delta,
            reason: h.reason,
            createdAt: h.createdAt.toISOString(),
          }))}
        />
      </section>
    </div>
  );
}
