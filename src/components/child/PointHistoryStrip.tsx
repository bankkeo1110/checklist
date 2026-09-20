type Entry = { id: string; delta: number; reason: string; createdAt: string };

export default function PointHistoryStrip({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm font-semibold text-muted">Chưa có lịch sử điểm.</p>;
  }

  return (
    <div className="rounded-2xl bg-white px-4 shadow-md">
      <ul className="divide-y divide-divider">
        {entries.map((e) => (
          <li key={e.id} className="flex items-center justify-between py-2.5">
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-bold">{e.reason}</p>
              <p className="text-[11.5px] font-semibold text-muted">
                {new Date(e.createdAt).toLocaleString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <span
              className="shrink-0 rounded-full px-3 py-1 text-[12.5px] font-extrabold"
              style={
                e.delta >= 0
                  ? { background: "var(--color-green-tint)", color: "var(--color-green-text)" }
                  : { background: "var(--color-divider)", color: "var(--color-muted)" }
              }
            >
              {e.delta > 0 ? `+${e.delta}` : e.delta}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
