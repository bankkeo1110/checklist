import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/mathfun/db";
import { answers } from "@/lib/mathfun/db/schema";
import { getMathfunUser } from "@/lib/mathfun/auth";

export async function POST(req: NextRequest) {
  const user = await getMathfunUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { topic, question, correctAnswer, studentAnswer, isCorrect } = body ?? {};
  if (typeof topic !== "string" || typeof question !== "string" || typeof correctAnswer !== "string" || typeof studentAnswer !== "string" || typeof isCorrect !== "boolean") {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const [row] = await db
    .insert(answers)
    .values({
      studentId: user.studentId,
      topic,
      question,
      correctAnswer,
      studentAnswer,
      isCorrect,
    })
    .returning();
  return NextResponse.json(row);
}
