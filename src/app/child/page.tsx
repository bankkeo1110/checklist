import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reconcileMissedDaysForChild } from "@/lib/reconcile";
import { getChildPointTotal } from "@/lib/points";
import { currentWeekStart, dateStrToUTCDate, todayDateStr, weekDates } from "@/lib/date";
import { getWeeklyExerciseCounts } from "@/lib/mathfun/stats";
import WeeklyGrid from "@/components/child/WeeklyGrid";
import SelfCheckGrid from "@/components/child/SelfCheckGrid";
import SubjectFeedback from "@/components/child/SubjectFeedback";
import AnimalCollection from "@/components/child/AnimalCollection";
import DragonBallCollection from "@/components/child/DragonBallCollection";
import PointHistoryStrip from "@/components/child/PointHistoryStrip";
import ChangePinForm from "@/components/child/ChangePinForm";

export const dynamic = "force-dynamic";

const RECENT_HISTORY = 8;

export default async function ConPage() {
  const session = await getSession();
  if (!session || session.kind !== "child") return null;

  await reconcileMissedDaysForChild(session.id);

  const weekStart = currentWeekStart();
  const dates = weekDates(weekStart);
  const today = todayDateStr();

  const [
    tasks,
    instances,
    bedtimeItems,
    bedtimeLogs,
    wakeupItems,
    wakeupLogs,
    subjectItems,
    subjectLogs,
    pointTotal,
    animalUnlocks,
    dragonBallUnlocks,
    goal,
    latestGrowth,
    history,
    weeklyExerciseCounts,
  ] = await Promise.all([
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
      where: { childId: session.id, date: { gte: dateStrToUTCDate(dates[0]), lte: dateStrToUTCDate(dates[6]) } },
    }),
    prisma.wakeupItem.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.wakeupLog.findMany({
      where: { childId: session.id, date: { gte: dateStrToUTCDate(dates[0]), lte: dateStrToUTCDate(dates[6]) } },
    }),
    prisma.subjectItem.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.subjectLog.findMany({
      where: { childId: session.id, weekStart: dateStrToUTCDate(weekStart) },
    }),
    getChildPointTotal(session.id),
    prisma.animalUnlock.findMany({ where: { childId: session.id }, select: { threshold: true } }),
    prisma.dragonBallUnlock.findMany({ where: { childId: session.id }, select: { threshold: true } }),
    prisma.weeklyGoal.findUnique({
      where: { childId_weekStart: { childId: session.id, weekStart: dateStrToUTCDate(weekStart) } },
    }),
    prisma.growthRecord.findFirst({
      where: { childId: session.id },
      orderBy: { recordedAt: "desc" },
    }),
    // One extra row tells PointHistoryStrip whether to show "Xem thêm".
    prisma.pointLedger.findMany({
      where: { childId: session.id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: RECENT_HISTORY + 1,
    }),
    getWeeklyExerciseCounts(weekStart),
  ]);
  const exercisesThisWeek = weeklyExerciseCounts[session.name] ?? 0;

  const cellsByTask: Record<string, Record<string, { id: string; status: string }>> = {};
  for (const instance of instances) {
    const dateStr = instance.date.toISOString().slice(0, 10);
    cellsByTask[instance.taskId] ??= {};
    cellsByTask[instance.taskId][dateStr] = { id: instance.id, status: instance.status };
  }

  const bedtimeCheckedMap: Record<string, Record<string, boolean>> = {};
  for (const log of bedtimeLogs) {
    const dateStr = log.date.toISOString().slice(0, 10);
    bedtimeCheckedMap[log.bedtimeItemId] ??= {};
    bedtimeCheckedMap[log.bedtimeItemId][dateStr] = log.checked;
  }

  const wakeupCheckedMap: Record<string, Record<string, boolean>> = {};
  for (const log of wakeupLogs) {
    const dateStr = log.date.toISOString().slice(0, 10);
    wakeupCheckedMap[log.wakeupItemId] ??= {};
    wakeupCheckedMap[log.wakeupItemId][dateStr] = log.checked;
  }

  const subjectCheckedMap: Record<string, boolean> = {};
  for (const log of subjectLogs) {
    subjectCheckedMap[log.subjectItemId] = log.checked;
  }

  return (
    <div className="flex flex-col gap-5">
      <div
        className="sticky top-0 z-20 -mx-4 flex gap-3 px-4 pb-3 pt-1"
        style={{ background: "var(--color-canvas)" }}
      >
        <div
          className="flex-1 rounded-[22px] p-4 text-white shadow-lg"
          style={{ background: "linear-gradient(150deg,#FFC93C,#FF9F45)" }}
        >
          <p className="text-xs font-bold uppercase tracking-wide opacity-90">Tổng điểm</p>
          <p className="font-display text-[34px] font-extrabold leading-tight">⭐ {pointTotal}</p>
        </div>
        <div className="flex-1 rounded-[22px] bg-white p-4 shadow-md">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Bài Toán tuần này</p>
          <p className="font-display text-[34px] font-extrabold leading-tight text-blue-text">🧮 {exercisesThisWeek}</p>
        </div>
        {goal?.goalText && (
          <div className="flex-1 rounded-[22px] bg-white p-4 shadow-md">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Mục tiêu tuần</p>
            <p className="mt-1 text-[14.5px] font-bold">{goal.goalText}</p>
          </div>
        )}
        {latestGrowth && (
          <div className="flex-1 rounded-[22px] bg-white p-4 shadow-md">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Chiều cao / cân nặng</p>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-[14.5px] font-bold text-blue-text">📏 {latestGrowth.heightCm} cm</span>
              <span className="text-[14.5px] font-bold text-green-text">⚖️ {latestGrowth.weightKg} kg</span>
            </div>
            <p className="mt-0.5 text-[11px] font-semibold text-muted">
              {latestGrowth.recordedAt.toLocaleDateString("vi-VN")}
            </p>
          </div>
        )}
      </div>

      <section className="flex flex-col gap-2.5">
        <h2 className="font-display text-[15px] font-bold">🐾 Bộ sưu tập thú cưng</h2>
        <AnimalCollection pointTotal={pointTotal} openedThresholds={animalUnlocks.map((u) => u.threshold)} />
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="font-display text-[15px] font-bold">🐉 Cấp độ Dragon Ball</h2>
        <DragonBallCollection pointTotal={pointTotal} openedThresholds={dragonBallUnlocks.map((u) => u.threshold)} />
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="font-display text-[15px] font-bold">🌅 Checklist buổi sáng</h2>
        <SelfCheckGrid
          items={wakeupItems.map((i) => ({ id: i.id, label: i.label, points: i.points }))}
          dates={dates}
          today={today}
          checkedMap={wakeupCheckedMap}
          toggleUrl="/api/wakeup-logs/toggle"
          itemIdField="wakeupItemId"
          accent="orange"
        />
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="font-display text-[15px] font-bold">🎯 Nhiệm vụ tuần</h2>
        <WeeklyGrid
          tasks={tasks.map((t) => ({
            id: t.id,
            title: t.title,
            points: t.points,
          }))}
          dates={dates}
          today={today}
          cellsByTask={cellsByTask}
        />
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="font-display text-[15px] font-bold">📚 Nhận xét của cô</h2>
        <SubjectFeedback
          items={subjectItems.map((i) => ({ id: i.id, label: i.label, points: i.points }))}
          checkedMap={subjectCheckedMap}
        />
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="font-display text-[15px] font-bold">🌙 Checklist trước khi đi ngủ</h2>
        <SelfCheckGrid
          items={bedtimeItems.map((i) => ({ id: i.id, label: i.label, points: i.points }))}
          dates={dates}
          today={today}
          checkedMap={bedtimeCheckedMap}
          toggleUrl="/api/bedtime-logs/toggle"
          itemIdField="bedtimeItemId"
          accent="blue"
        />
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="font-display text-[15px] font-bold">📋 Gần đây</h2>
        <PointHistoryStrip
          initialHasMore={history.length > RECENT_HISTORY}
          initialEntries={history.slice(0, RECENT_HISTORY).map((h) => ({
            id: h.id,
            delta: h.delta,
            reason: h.reason,
            createdAt: h.createdAt.toISOString(),
          }))}
        />
      </section>

      <ChangePinForm />
    </div>
  );
}
