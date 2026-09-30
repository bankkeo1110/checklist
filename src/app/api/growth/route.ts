import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { dateStrToUTCDate, todayDateStr } from "@/lib/date";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.kind !== "parent") {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const childId = body?.childId;
  const heightCm = Number(body?.heightCm);
  const weightKg = Number(body?.weightKg);

  if (typeof childId !== "string") {
    return NextResponse.json({ error: "Thiếu con." }, { status: 400 });
  }
  if (!Number.isFinite(heightCm) || heightCm <= 0 || heightCm > 250) {
    return NextResponse.json({ error: "Chiều cao không hợp lệ." }, { status: 400 });
  }
  if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 200) {
    return NextResponse.json({ error: "Cân nặng không hợp lệ." }, { status: 400 });
  }

  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child) {
    return NextResponse.json({ error: "Không tìm thấy con." }, { status: 404 });
  }

  // Ngày nhập luôn là hôm nay — do server quyết định, không cho chọn ngày.
  const recordedAt = todayDateStr();

  const record = await prisma.growthRecord.upsert({
    where: { childId_recordedAt: { childId, recordedAt: dateStrToUTCDate(recordedAt) } },
    update: { heightCm, weightKg },
    create: { childId, heightCm, weightKg, recordedAt: dateStrToUTCDate(recordedAt) },
  });

  return NextResponse.json({ record });
}
