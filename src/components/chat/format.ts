const TIME_ZONE = "Asia/Ho_Chi_Minh";

const timeFormat = new Intl.DateTimeFormat("vi-VN", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" });
const dayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });
const dayLabelFormat = new Intl.DateTimeFormat("vi-VN", {
  timeZone: TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "numeric",
});

export function formatTime(iso: string) {
  return timeFormat.format(new Date(iso));
}

/** YYYY-MM-DD in Vietnam time, for grouping messages by day. */
export function dayKey(iso: string) {
  return dayFormat.format(new Date(iso));
}

export function formatDayLabel(iso: string) {
  const key = dayKey(iso);
  const today = dayKey(new Date().toISOString());
  const yesterday = dayKey(new Date(Date.now() - 86_400_000).toISOString());
  if (key === today) return "Hôm nay";
  if (key === yesterday) return "Hôm qua";
  return dayLabelFormat.format(new Date(iso));
}

/** Short stamp for the inbox: time if today, otherwise day/month. */
export function formatInboxStamp(iso: string) {
  if (dayKey(iso) === dayKey(new Date().toISOString())) return formatTime(iso);
  const [, month, day] = dayKey(iso).split("-");
  return `${Number(day)}/${Number(month)}`;
}
