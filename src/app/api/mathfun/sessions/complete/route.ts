import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/mathfun/db";
import { studentBadges } from "@/lib/mathfun/db/schema";
import { getMathfunUser } from "@/lib/mathfun/auth";

const BADGE_RANK: Record<string, number> = { bronze: 1, silver: 2, gold: 3, perfect: 4 };

// Badge based on accuracy (correct / total answered * 100)
function calcBadge(accuracy: number): string {
  if (accuracy === 100) return "perfect";
  if (accuracy >= 85) return "gold";
  if (accuracy >= 70) return "silver";
  return "bronze";
}

export async function POST(req: NextRequest) {
  const user = await getMathfunUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  const { topic, correct, total } = await req.json().catch(() => ({}));
  if (!topic || correct == null || !total) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const accuracy = Math.round((correct / total) * 100);
  const newBadge = calcBadge(accuracy);

  const existing = await db
    .select()
    .from(studentBadges)
    .where(and(eq(studentBadges.studentId, user.studentId), eq(studentBadges.topic, topic)))
    .limit(1);

  if (!existing.length) {
    await db.insert(studentBadges).values({ studentId: user.studentId, topic, badge: newBadge, bestScore: accuracy, attempts: 1 });
    return NextResponse.json({ badge: newBadge, isNew: true, isUpgrade: false, previousBadge: null });
  }

  const prev = existing[0];
  const isUpgrade = BADGE_RANK[newBadge] > BADGE_RANK[prev.badge];
  const finalBadge = isUpgrade ? newBadge : prev.badge;
  const finalScore = accuracy > prev.bestScore ? accuracy : prev.bestScore;

  await db
    .update(studentBadges)
    .set({
      badge: finalBadge,
      bestScore: finalScore,
      attempts: prev.attempts + 1,
      updatedAt: new Date(),
    })
    .where(eq(studentBadges.id, prev.id));

  return NextResponse.json({ badge: finalBadge, isNew: false, isUpgrade, previousBadge: prev.badge });
}
