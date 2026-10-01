import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db, ready } from "@/lib/mathfun/db";
import { students } from "@/lib/mathfun/db/schema";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  await ready;
  const all = await db.select().from(students).orderBy(students.name);
  return NextResponse.json(all);
}
