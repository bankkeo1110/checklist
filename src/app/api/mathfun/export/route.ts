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
  const allStudents = await db.select().from(students);

  const rows = studentId
    ? await db.select().from(answers).where(eq(answers.studentId, parseInt(studentId))).orderBy(desc(answers.answeredAt))
    : await db.select().from(answers).orderBy(desc(answers.answeredAt));

  const header = ["Student", "Topic", "Question", "Correct Answer", "Student Answer", "Result", "Date"];
  const csvRows = rows.map((r) => {
    const student = allStudents.find((s) => s.id === r.studentId);
    const date = r.answeredAt ? new Date(r.answeredAt).toLocaleString() : "";
    return [
      student?.name ?? "",
      r.topic,
      `"${r.question.replace(/"/g, '""')}"`,
      r.correctAnswer,
      r.studentAnswer,
      r.isCorrect ? "Correct" : "Wrong",
      date,
    ].join(",");
  });

  const csv = [header.join(","), ...csvRows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="math-report.csv"',
    },
  });
}
