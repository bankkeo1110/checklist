import { prisma } from "./prisma";
import { addDaysToDateStr, dateStrToUTCDate, todayDateStr, weekStartForDateStr } from "./date";

// How far back we're willing to lazily backfill "missed" days if nobody
// opened the app for a while. Keeps the reconciliation query bounded.
const LOOKBACK_DAYS = 14;

type MissedDay = { taskId: string; date: string; points: number; title: string };

/**
 * For every active task assigned to a child, any past day (before today,
 * within the lookback window, on/after the task's creation date) that never
 * got a task_instance row is a day that ended with no check-in at all —
 * per the point rules that's an automatic miss and a point deduction.
 *
 * Writes are batched (createMany) instead of one $transaction per missed
 * day — with enough backlog (a child who hasn't opened the app in a while,
 * or several active tasks × the full 14-day window) the old per-day
 * transaction loop could rack up dozens of sequential round trips and blow
 * Prisma's interactive-transaction timeout, 500ing the whole page.
 */
export async function reconcileMissedDaysForChild(childId: string): Promise<void> {
  const today = todayDateStr();
  const earliest = addDaysToDateStr(today, -LOOKBACK_DAYS);

  const tasks = await prisma.task.findMany({
    where: { active: true, assignedTo: { some: { id: childId } } },
    select: { id: true, points: true, title: true, createdAt: true },
  });
  if (tasks.length === 0) return;

  const missed: MissedDay[] = [];

  for (const task of tasks) {
    const taskCreatedDateStr = task.createdAt.toISOString().slice(0, 10);
    const startDate = taskCreatedDateStr > earliest ? taskCreatedDateStr : earliest;
    if (startDate >= today) continue;

    const datesToCheck: string[] = [];
    for (let cursor = startDate; cursor < today; cursor = addDaysToDateStr(cursor, 1)) {
      datesToCheck.push(cursor);
    }
    if (datesToCheck.length === 0) continue;

    const existing = await prisma.taskInstance.findMany({
      where: {
        taskId: task.id,
        childId,
        date: { gte: dateStrToUTCDate(startDate), lt: dateStrToUTCDate(today) },
      },
      select: { date: true },
    });
    const existingDates = new Set(existing.map((e) => e.date.toISOString().slice(0, 10)));
    for (const d of datesToCheck) {
      if (!existingDates.has(d)) missed.push({ taskId: task.id, date: d, points: task.points, title: task.title });
    }
  }

  if (missed.length === 0) return;

  // skipDuplicates absorbs the rare race of two concurrent reconciles for
  // the same child (each request's own `existing` snapshot could otherwise
  // both decide the same day is missing).
  await prisma.taskInstance.createMany({
    data: missed.map((m) => ({
      taskId: m.taskId,
      childId,
      date: dateStrToUTCDate(m.date),
      weekStart: dateStrToUTCDate(weekStartForDateStr(m.date)),
      status: "MISSED" as const,
      reviewedAt: new Date(),
    })),
    skipDuplicates: true,
  });

  const taskIds = [...new Set(missed.map((m) => m.taskId))];
  const createdInstances = await prisma.taskInstance.findMany({
    where: {
      childId,
      status: "MISSED",
      taskId: { in: taskIds },
      date: { gte: dateStrToUTCDate(earliest), lt: dateStrToUTCDate(today) },
    },
    select: { id: true, taskId: true, date: true },
  });
  const idByTaskDate = new Map(createdInstances.map((c) => [`${c.taskId}:${c.date.toISOString().slice(0, 10)}`, c.id]));

  // Some of those instances may already have a ledger entry from an earlier
  // reconcile (or the concurrent-race case above) — skip those so we never
  // double-deduct the same missed day.
  const alreadyLedgered = new Set(
    (
      await prisma.pointLedger.findMany({
        where: { taskInstanceId: { in: createdInstances.map((c) => c.id) } },
        select: { taskInstanceId: true },
      })
    ).map((l) => l.taskInstanceId),
  );

  const ledgerData = missed
    .map((m) => {
      const instanceId = idByTaskDate.get(`${m.taskId}:${m.date}`);
      if (!instanceId || alreadyLedgered.has(instanceId)) return null;
      return {
        childId,
        taskInstanceId: instanceId,
        delta: -m.points,
        reason: `Không check-in: ${m.title} (${m.date})`,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (ledgerData.length > 0) {
    await prisma.pointLedger.createMany({ data: ledgerData });
  }
}
