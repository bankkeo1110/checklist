import { NextRequest, NextResponse } from "next/server";
import { db, ready } from "@/lib/mathfun/db";
import { answers } from "@/lib/mathfun/db/schema";
import { getMathfunUser } from "@/lib/mathfun/auth";

export async function POST(req: NextRequest) {
  const user = await getMathfunUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { topic, question, correctAnswer, studentAnswer, isCorrect, kind, isRetry } = body ?? {};
  if (typeof topic !== "string" || typeof question !== "string" || typeof correctAnswer !== "string" || typeof studentAnswer !== "string" || typeof isCorrect !== "boolean") {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await ready; // the kind / is_retry columns are added on boot
  const [row] = await db
    .insert(answers)
    .values({
      studentId: user.studentId,
      topic,
      question,
      correctAnswer,
      studentAnswer,
      isCorrect,
      kind: typeof kind === "string" ? kind.slice(0, 120) : null,
      isRetry: typeof isRetry === "boolean" ? isRetry : null,
    })
    .returning();
  return NextResponse.json(row);
}
