import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getChildPointTotal } from "@/lib/points";
import { ANIMAL_TIERS } from "@/lib/animals";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.kind !== "child") {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const threshold = Number(body?.threshold);
  const tier = ANIMAL_TIERS.find((t) => t.threshold === threshold);
  if (!tier) {
    return NextResponse.json({ error: "Mức không hợp lệ." }, { status: 400 });
  }

  // Dùng tổng điểm hiện tại (giống số hiển thị ở "Tổng điểm") chứ không phải
  // tổng đã từng kiếm được — nếu không, điểm bị trừ do bỏ lỡ ngày vẫn cho mở
  // được con vật, gây khó hiểu vì số hiện trên màn hình không khớp.
  const currentTotal = await getChildPointTotal(session.id);
  if (currentTotal < threshold) {
    return NextResponse.json({ error: `Chưa đủ sao để mở con vật này — cần ${threshold} sao, cố gắng hơn nhé!` }, { status: 403 });
  }

  await prisma.animalUnlock.upsert({
    where: { childId_threshold: { childId: session.id, threshold } },
    update: {},
    create: { childId: session.id, threshold },
  });

  return NextResponse.json({ ok: true });
}
