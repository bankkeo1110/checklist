import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gte, isNotNull } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getMathfunUser } from "@/lib/mathfun/auth";
import { db, ready } from "@/lib/mathfun/db";
import { answers, sessions, students } from "@/lib/mathfun/db/schema";
import { analyse, toMarkdown } from "@/lib/mathfun/analysis";

const RANGES: Record<string, string> = { "7": "7 ngày gần nhất", "30": "30 ngày gần nhất", "0": "toàn bộ thời gian" };

/**
 * Strengths / weaknesses for one student, plus a Markdown report to paste into Claude.
 * A child always gets their own; a parent picks a student (default: the first one).
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  await ready;

  const { searchParams } = new URL(req.url);
  const days = RANGES[searchParams.get("days") ?? ""] ? searchParams.get("days")! : "30";
  const allStudents = await db.select({ id: students.id, name: students.name }).from(students).orderBy(students.name);

  let studentId: number | null = null, name = "";
  if (session.kind === "child") {
    const me = await getMathfunUser();
    if (!me) return NextResponse.json({ error: "Chưa có hồ sơ học sinh." }, { status: 404 });
    studentId = me.studentId; name = me.name;
  } else {
    const wanted = Number(searchParams.get("studentId"));
    const s = allStudents.find((x) => x.id === wanted) ?? allStudents[0];
    if (!s) return NextResponse.json({ students: [], analysis: null, markdown: "" });
    studentId = s.id; name = s.name;
  }

  const since = days === "0" ? null : new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
  const rows = await db.select().from(answers)
    .where(since ? and(eq(answers.studentId, studentId), gte(answers.answeredAt, since)) : eq(answers.studentId, studentId))
    .orderBy(desc(answers.answeredAt));
  const done = await db.select().from(sessions)
    .where(and(eq(sessions.studentId, studentId), isNotNull(sessions.finishedAt), ...(since ? [gte(sessions.finishedAt, since)] : [])))
    .orderBy(desc(sessions.finishedAt));

  const analysis = analyse(rows, done);
  return NextResponse.json({
    students: session.kind === "child" ? [] : allStudents,
    studentId, name, days, rangeLabel: RANGES[days],
    analysis,
    markdown: toMarkdown(name, RANGES[days], analysis),
  });
}
