import { prisma } from "./prisma";

export async function getChildPointTotal(childId: string): Promise<number> {
  const result = await prisma.pointLedger.aggregate({
    where: { childId },
    _sum: { delta: true },
  });
  return result._sum.delta ?? 0;
}

export async function getChildPointTotals(): Promise<Record<string, number>> {
  const rows = await prisma.pointLedger.groupBy({
    by: ["childId"],
    _sum: { delta: true },
  });
  const totals: Record<string, number> = {};
  for (const row of rows) {
    totals[row.childId] = row._sum.delta ?? 0;
  }
  return totals;
}
