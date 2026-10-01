import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db, ready } from "@/lib/mathfun/db";
import { students } from "@/lib/mathfun/db/schema";

export type MathfunUser = { studentId: number; name: string; avatar: string | null };

// The standalone MathFun site had its own signup, so the two kids' existing
// `students` rows (with their practice history and badges) are keyed by
// whatever name they picked there — not the checklist ChildName enum. Map the
// two known accounts explicitly so logging in through checklist resumes the
// same progress instead of starting a blank profile.
const STUDENT_NAME_BY_CHILD: Partial<Record<string, string>> = {
  OTIS: "Otis",
  LIAM: "Liam",
};

/**
 * Resolves the checklist session to its MathFun student row, auto-creating
 * one on first use. Returns null for a parent session (or no session) — a
 * parent has no personal practice profile in MathFun.
 */
export async function getMathfunUser(): Promise<MathfunUser | null> {
  const session = await getSession();
  if (!session || session.kind !== "child") return null;
  await ready;

  const studentName = STUDENT_NAME_BY_CHILD[session.name] ?? session.name;
  const [existing] = await db.select().from(students).where(eq(students.name, studentName)).limit(1);
  if (existing) return { studentId: existing.id, name: session.label, avatar: existing.avatar };

  const [created] = await db.insert(students).values({ name: studentName }).returning();
  return { studentId: created.id, name: session.label, avatar: created.avatar };
}
