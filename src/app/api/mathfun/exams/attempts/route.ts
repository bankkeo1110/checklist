import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getMathfunUser } from "@/lib/mathfun/auth";
import { db, ready } from "@/lib/mathfun/db";
import { examAttempts, students } from "@/lib/mathfun/db/schema";
import { EXAMS } from "@/lib/mathfun/exams";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  await ready;
  const user = await getMathfunUser();

  const rows = user
    ? await db
        .select({ attempt: examAttempts, studentName: students.name })
        .from(examAttempts)
        .innerJoin(students, eq(examAttempts.studentId, students.id))
        .where(eq(examAttempts.studentId, user.studentId))
        .orderBy(desc(examAttempts.finishedAt))
    : // Parent session: every student's attempts.
      await db
        .select({ attempt: examAttempts, studentName: students.name })
        .from(examAttempts)
        .innerJoin(students, eq(examAttempts.studentId, students.id))
        .orderBy(desc(examAttempts.finishedAt));

  const examTitle = (examId: string) => EXAMS.find((e) => e.id === examId)?.title ?? examId;

  return NextResponse.json({
    attempts: rows.map(({ attempt, studentName }) => ({
      id: attempt.id,
      studentName,
      examId: attempt.examId,
      examTitle: examTitle(attempt.examId),
      correct: attempt.correct,
      total: attempt.total,
      bySkill: JSON.parse(attempt.bySkill),
      finishedAt: attempt.finishedAt,
    })),
  });
}
