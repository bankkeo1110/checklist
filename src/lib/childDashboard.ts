import { prisma } from "./prisma";
import { getChildPointTotal } from "./points";
import { currentWeekStart, dateStrToUTCDate, todayDateStr, weekDates } from "./date";

// Same data the child's own /child page renders, factored out so the
// parent-facing read-only "Tình trạng con" view can show exactly the same
// checklist/task state without duplicating every query by hand.
export async function getChildDashboardData(childId: string) {
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
  ] = await Promise.all([
    prisma.task.findMany({
      where: { active: true, assignedTo: { some: { id: childId } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.taskInstance.findMany({
      where: { childId, date: { gte: dateStrToUTCDate(dates[0]), lte: dateStrToUTCDate(dates[6]) } },
    }),
    prisma.bedtimeItem.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.bedtimeLog.findMany({
      where: { childId, date: { gte: dateStrToUTCDate(dates[0]), lte: dateStrToUTCDate(dates[6]) } },
    }),
    prisma.wakeupItem.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.wakeupLog.findMany({
      where: { childId, date: { gte: dateStrToUTCDate(dates[0]), lte: dateStrToUTCDate(dates[6]) } },
    }),
    prisma.subjectItem.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.subjectLog.findMany({ where: { childId, weekStart: dateStrToUTCDate(weekStart) } }),
    getChildPointTotal(childId),
    prisma.animalUnlock.findMany({ where: { childId }, select: { threshold: true } }),
    prisma.dragonBallUnlock.findMany({ where: { childId }, select: { threshold: true } }),
    prisma.weeklyGoal.findUnique({ where: { childId_weekStart: { childId, weekStart: dateStrToUTCDate(weekStart) } } }),
    prisma.growthRecord.findFirst({ where: { childId }, orderBy: { recordedAt: "desc" } }),
  ]);

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

  return {
    weekStart,
    dates,
    today,
    tasks,
    cellsByTask,
    bedtimeItems,
    bedtimeCheckedMap,
    wakeupItems,
    wakeupCheckedMap,
    subjectItems,
    subjectCheckedMap,
    pointTotal,
    animalUnlockedThresholds: animalUnlocks.map((u) => u.threshold),
    dragonBallUnlockedThresholds: dragonBallUnlocks.map((u) => u.threshold),
    goal,
    latestGrowth,
  };
}
