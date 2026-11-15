import { prisma } from "./prisma";
import { addDaysToDateStr, dateStrToUTCDate, todayDateStr, weekStartForDateStr } from "./date";

// How far back we're willing to lazily backfill "missed" days if nobody
// opened the app for a while. Keeps the reconciliation query bounded.
const LOOKBACK_DAYS = 14;

type MissedDay = { taskId: string; date: string };

/**
 * For every active task assigned to a child, any past day (before today,
 * within the lookback window, on/after the task's creation date) that never
 * got a task_instance row is a day that ended with no check-in at all. It
 * is recorded as MISSED (so the grid shows it) but costs no points.
 *
 * Writes are batched (createMany) instead of one $transaction per missed
 * day — with enough backlog (a child who hasn't opened the app in a while,
 * or several active tasks × the full 14-day window) the old per-day
 * transaction loop could rack up dozens of sequential round trips and blow
 * Prisma's interactive-transaction timeout, 500ing the whole page.
 */
export async function reconcileMissedDaysForChild(childId: string): Promise<void> {
  const today = todayDateStr();
  const lookbackFloor = addDaysToDateStr(today, -LOOKBACK_DAYS);

  const [tasks, child] = await Promise.all([
    prisma.task.findMany({
      where: { active: true, assignedTo: { some: { id: childId } } },
      select: { id: true, createdAt: true },
    }),
    prisma.child.findUnique({ where: { id: childId }, select: { historyResetAt: true } }),
  ]);
  if (tasks.length === 0) return;

  // A full reset moves the floor forward to the reset date, so nothing
  // before it ever gets backfilled as missed again.
  const historyResetAtStr = child?.historyResetAt?.toISOString().slice(0, 10);
  const earliest = historyResetAtStr && historyResetAtStr > lookbackFloor ? historyResetAtStr : lookbackFloor;

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
      if (!existingDates.has(d)) missed.push({ taskId: task.id, date: d });
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

  // Missed days are only marked on the grid — no points are deducted for a
  // task that simply wasn't checked. Points only go down when a parent
  // rejects a submitted check-in or adjusts points by hand.
}
