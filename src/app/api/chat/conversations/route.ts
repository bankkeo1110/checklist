import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getInbox } from "@/lib/chat";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }
  return NextResponse.json({ rows: await getInbox(session) });
}
