// All "date" values in this app are plain YYYY-MM-DD calendar strings in the
// family's timezone. We never store a time component for task/bedtime days.
const APP_TIMEZONE = "Asia/Ho_Chi_Minh";

const VN_WEEKDAY_LABELS = ["CN", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7"];

export function todayDateStr(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function dateStrToUTCDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export function addDaysToDateStr(dateStr: string, days: number): string {
  const d = dateStrToUTCDate(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function weekStartForDateStr(dateStr: string): string {
  const d = dateStrToUTCDate(dateStr);
  const dow = d.getUTCDay(); // 0 Sun .. 6 Sat
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  return addDaysToDateStr(dateStr, diffToMonday);
}

export function currentWeekStart(): string {
  return weekStartForDateStr(todayDateStr());
}

export function weekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDaysToDateStr(weekStart, i));
}

export function weekdayLabel(dateStr: string): string {
  return VN_WEEKDAY_LABELS[dateStrToUTCDate(dateStr).getUTCDay()];
}

export function dayOfMonth(dateStr: string): number {
  return dateStrToUTCDate(dateStr).getUTCDate();
}

export function isBeforeToday(dateStr: string): boolean {
  return dateStr < todayDateStr();
}

export function isToday(dateStr: string): boolean {
  return dateStr === todayDateStr();
}

export function compareDateStr(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
