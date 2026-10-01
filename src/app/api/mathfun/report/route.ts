import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db, ready } from "@/lib/mathfun/db";
import { answers, students } from "@/lib/mathfun/db/schema";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");

  await ready;
  const allStudents = await db.select().from(students).orderBy(students.name);

  const rows = studentId
    ? await db.select().from(answers).where(eq(answers.studentId, parseInt(studentId))).orderBy(desc(answers.answeredAt))
    : await db.select().from(answers).orderBy(desc(answers.answeredAt));

  // Aggregate by student + topic
  const statsMap: Record<string, { studentId: number; studentName: string; topic: string; correct: number; wrong: number; total: number }> = {};

  for (const row of rows) {
    const student = allStudents.find((s) => s.id === row.studentId);
    const key = `${row.studentId}-${row.topic}`;
    if (!statsMap[key]) {
      statsMap[key] = {
        studentId: row.studentId!,
        studentName: student?.name ?? "Unknown",
        topic: row.topic,
        correct: 0,
        wrong: 0,
        total: 0,
      };
    }
    statsMap[key].total++;
    if (row.isCorrect) statsMap[key].correct++;
    else statsMap[key].wrong++;
  }

  const stats = Object.values(statsMap).sort((a, b) => a.studentName.localeCompare(b.studentName));

  return NextResponse.json({ students: allStudents, stats, recentAnswers: rows.slice(0, 50) });
}
