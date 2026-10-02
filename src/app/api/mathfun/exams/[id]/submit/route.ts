import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/mathfun/db";
import { examAttempts } from "@/lib/mathfun/db/schema";
import { getMathfunUser } from "@/lib/mathfun/auth";
import { getExam, gradeQuestion, correctAnswerSummary, skillPerQuestion } from "@/lib/mathfun/exams";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getMathfunUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  const { id } = await params;
  const exam = getExam(id);
  if (!exam) return NextResponse.json({ error: "Không tìm thấy đề thi." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const given: Record<number, number | number[] | string[]> = body?.answers ?? {};
  const skills = skillPerQuestion(exam);

  const bySkill: Record<string, { correct: number; total: number }> = {};
  const answerDetails: Record<number, { given: unknown; isCorrect: boolean; correctAnswer: string }> = {};
  let correct = 0;

  exam.questions.forEach((q, i) => {
    const isCorrect = gradeQuestion(q, given[i]);
    if (isCorrect) correct++;
    const skill = skills[i];
    bySkill[skill] ??= { correct: 0, total: 0 };
    bySkill[skill].total++;
    if (isCorrect) bySkill[skill].correct++;
    answerDetails[i] = { given: given[i] ?? null, isCorrect, correctAnswer: correctAnswerSummary(q) };
  });

  await db.insert(examAttempts).values({
    studentId: user.studentId,
    examId: exam.id,
    correct,
    total: exam.questions.length,
    answers: JSON.stringify(answerDetails),
    bySkill: JSON.stringify(bySkill),
  });

  return NextResponse.json({ correct, total: exam.questions.length, bySkill, answers: answerDetails });
}
