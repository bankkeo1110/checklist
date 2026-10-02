import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db, ready } from "@/lib/mathfun/db";
import { examAttempts, students } from "@/lib/mathfun/db/schema";
import { EXAMS } from "@/lib/mathfun/exams";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  await ready;
  const rows = await db
    .select({ attempt: examAttempts, studentName: students.name })
    .from(examAttempts)
    .innerJoin(students, eq(examAttempts.studentId, students.id))
    .orderBy(desc(examAttempts.finishedAt));

  const examTitle = (examId: string) => EXAMS.find((e) => e.id === examId)?.title ?? examId;

  const header = ["Học sinh", "Đề thi", "Số câu đúng", "Tổng số câu", "Điểm (%)", "Thời gian nộp bài"];
  const csvRows = rows.map(({ attempt, studentName }) => {
    const pct = Math.round((attempt.correct / attempt.total) * 100);
    const date = attempt.finishedAt ? new Date(attempt.finishedAt).toLocaleString("vi-VN") : "";
    return [studentName, examTitle(attempt.examId), attempt.correct, attempt.total, pct, date].join(",");
  });

  const csv = [header.join(","), ...csvRows].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="mathfun-exam-results.csv"',
    },
  });
}
