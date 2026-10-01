import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/mathfun/db";
import { students } from "@/lib/mathfun/db/schema";
import { getMathfunUser } from "@/lib/mathfun/auth";

const VALID_AVATARS = new Set([
  "🦁", "🐯", "🐻", "🐼", "🦊", "🐺",
  "🦄", "🐲", "🦈", "🐙", "🦋", "🐸",
  "🦅", "🦉", "🦜", "🐬", "🐒", "🐘",
  "🦒", "🦓", "🦝", "🦩", "🦚", "👾",
]);

export async function PATCH(req: NextRequest) {
  const user = await getMathfunUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { avatar } = await req.json().catch(() => ({}));
  if (!VALID_AVATARS.has(avatar)) return NextResponse.json({ error: "Invalid avatar" }, { status: 400 });

  await db.update(students).set({ avatar }).where(eq(students.id, user.studentId));
  return NextResponse.json({ success: true, avatar });
}
