import { addDaysToDateStr, dateStrFromDate, weekStartForDateStr } from "./date";

export type PointSummaryRow = { key: string; label: string; total: number };

function weekLabel(weekStart: string): string {
  const [, m1, d1] = weekStart.split("-");
  const weekEnd = addDaysToDateStr(weekStart, 6);
  const [, m2, d2] = weekEnd.split("-");
  return `Tuần ${d1}/${m1} – ${d2}/${m2}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  return `Tháng ${Number(m)}/${y}`;
}

function quarterLabel(key: string): string {
  const [y, q] = key.split("-Q");
  return `Quý ${q}/${y}`;
}

function toSortedRows(map: Map<string, number>, label: (key: string) => string): PointSummaryRow[] {
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1)) // newest key first
    .map(([key, total]) => ({ key, label: label(key), total }));
}

// Groups a child's point-ledger history into weekly/monthly/quarterly/yearly
// net totals (sum of delta, same "points" definition as the running
// balance) — all four views are derived from the same raw entries, so a
// "reset điểm tuần" (which is just one more ledger entry) always shows up
// consistently in every grouping without needing a separate archive table.
export function summarizePointHistory(entries: { delta: number; createdAt: Date }[]): {
  weeks: PointSummaryRow[];
  months: PointSummaryRow[];
  quarters: PointSummaryRow[];
  years: PointSummaryRow[];
} {
  const byWeek = new Map<string, number>();
  const byMonth = new Map<string, number>();
  const byQuarter = new Map<string, number>();
  const byYear = new Map<string, number>();

  for (const e of entries) {
    const dateStr = dateStrFromDate(e.createdAt);
    const weekKey = weekStartForDateStr(dateStr);
    const [y, m] = dateStr.split("-");
    const monthKey = `${y}-${m}`;
    const quarterKey = `${y}-Q${Math.ceil(Number(m) / 3)}`;

    byWeek.set(weekKey, (byWeek.get(weekKey) ?? 0) + e.delta);
    byMonth.set(monthKey, (byMonth.get(monthKey) ?? 0) + e.delta);
    byQuarter.set(quarterKey, (byQuarter.get(quarterKey) ?? 0) + e.delta);
    byYear.set(y, (byYear.get(y) ?? 0) + e.delta);
  }

  return {
    weeks: toSortedRows(byWeek, weekLabel),
    months: toSortedRows(byMonth, monthLabel),
    quarters: toSortedRows(byQuarter, quarterLabel),
    years: toSortedRows(byYear, (y) => `Năm ${y}`),
  };
}
