import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getExam, sanitizeExam } from "@/lib/mathfun/exams";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  const { id } = await params;
  const exam = getExam(id);
  if (!exam) return NextResponse.json({ error: "Không tìm thấy đề thi." }, { status: 404 });

  return NextResponse.json({ exam: sanitizeExam(exam) });
}
