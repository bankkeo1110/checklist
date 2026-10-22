import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { GAMES, setGameActive, type GameId } from "@/lib/games";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.kind !== "parent") {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const { id } = await params;
  if (!GAMES.some((g) => g.id === id)) {
    return NextResponse.json({ error: "Trò chơi không hợp lệ." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (typeof body?.active !== "boolean") {
    return NextResponse.json({ error: "Thiếu trạng thái hiển thị." }, { status: 400 });
  }

  await setGameActive(id as GameId, body.active);
  return NextResponse.json({ ok: true });
}
