type Entry = { id: string; delta: number; reason: string; createdAt: string };

export default function PointHistoryStrip({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-ink/50">Chưa có lịch sử điểm.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {entries.map((e) => (
        <li key={e.id} className="flex items-center justify-between border border-divider bg-surface px-4 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm">{e.reason}</p>
            <p className="text-xs text-ink/50">
              {new Date(e.createdAt).toLocaleString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <span
            className={`shrink-0 px-2.5 py-1 text-sm font-bold ${
              e.delta >= 0 ? "bg-accent-100 text-accent-800" : "bg-neutral-100 text-neutral-800"
            }`}
          >
            {e.delta > 0 ? `+${e.delta}` : e.delta}
          </span>
        </li>
      ))}
    </ul>
  );
}
