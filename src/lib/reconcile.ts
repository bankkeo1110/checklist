import { prisma } from "./prisma";
import { addDaysToDateStr, dateStrToUTCDate, todayDateStr, weekStartForDateStr } from "./date";

// How far back we're willing to lazily backfill "missed" days if nobody
// opened the app for a while. Keeps the reconciliation query bounded.
const LOOKBACK_DAYS = 14;

/**
 * For every active task assigned to a child, any past day (before today,
 * within the lookback window, on/after the task's creation date) that never
 * got a task_instance row is a day that ended with no check-in at all —
 * per the point rules that's an automatic miss and a point deduction.
 */
export async function reconcileMissedDaysForChild(childId: string): Promise<void> {
  const today = todayDateStr();
  const earliest = addDaysToDateStr(today, -LOOKBACK_DAYS);

  const tasks = await prisma.task.findMany({
    where: { active: true, assignedTo: { some: { id: childId } } },
    select: { id: true, points: true, title: true, createdAt: true },
  });
  if (tasks.length === 0) return;

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
    const missingDates = datesToCheck.filter((d) => !existingDates.has(d));

    for (const missedDate of missingDates) {
      try {
        await prisma.$transaction(async (tx) => {
          const instance = await tx.taskInstance.create({
            data: {
              taskId: task.id,
              childId,
              date: dateStrToUTCDate(missedDate),
              weekStart: dateStrToUTCDate(weekStartForDateStr(missedDate)),
              status: "MISSED",
              reviewedAt: new Date(),
            },
          });
          await tx.pointLedger.create({
            data: {
              childId,
              taskInstanceId: instance.id,
              delta: -task.points,
              reason: `Không check-in: ${task.title} (${missedDate})`,
            },
          });
        });
      } catch (err: unknown) {
        // Unique constraint race (e.g. reconciled concurrently) — safe to ignore.
        if (!(err instanceof Error) || !err.message.includes("Unique constraint")) {
          throw err;
        }
      }
    }
  }
}
