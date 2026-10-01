import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db, ready } from "@/lib/mathfun/db";
import { students, studentBadges, answers } from "@/lib/mathfun/db/schema";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  const { id } = await params;
  const studentId = parseInt(id);
  if (isNaN(studentId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await ready;
  const [student] = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const badges = await db.select().from(studentBadges).where(eq(studentBadges.studentId, studentId));

  const recentAnswers = await db
    .select()
    .from(answers)
    .where(eq(answers.studentId, studentId))
    .orderBy(desc(answers.answeredAt))
    .limit(30);

  return NextResponse.json({ student, badges, recentAnswers });
}
