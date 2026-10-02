import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { EXAMS } from "@/lib/mathfun/exams";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  return NextResponse.json({
    exams: EXAMS.map((e) => ({
      id: e.id,
      title: e.title,
      grade: e.grade,
      durationMinutes: e.durationMinutes,
      questionCount: e.questions.length,
      skills: e.skills,
    })),
  });
}
