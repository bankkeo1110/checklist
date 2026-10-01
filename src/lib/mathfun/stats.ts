import { eq, gte } from "drizzle-orm";
import { db, ready } from "@/lib/mathfun/db";
import { sessions, students } from "@/lib/mathfun/db/schema";
import { mathfunStudentName, STUDENT_NAME_BY_CHILD } from "@/lib/mathfun/students";

const APP_TIMEZONE_OFFSET = "+07:00"; // Asia/Ho_Chi_Minh, fixed (no DST)

/** Finished-exercise counts this week, keyed by ChildName (OTIS/LIAM). */
export async function getWeeklyExerciseCounts(weekStart: string): Promise<Record<string, number>> {
  await ready;
  const weekStartInstant = new Date(`${weekStart}T00:00:00${APP_TIMEZONE_OFFSET}`);

  const rows = await db
    .select({ studentName: students.name })
    .from(sessions)
    .innerJoin(students, eq(sessions.studentId, students.id))
    .where(gte(sessions.finishedAt, weekStartInstant));

  const countByStudentName: Record<string, number> = {};
  for (const row of rows) {
    countByStudentName[row.studentName] = (countByStudentName[row.studentName] ?? 0) + 1;
  }

  const result: Record<string, number> = {};
  for (const childName of Object.keys(STUDENT_NAME_BY_CHILD)) {
    result[childName] = countByStudentName[mathfunStudentName(childName)] ?? 0;
  }
  return result;
}
