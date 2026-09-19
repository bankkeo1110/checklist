type Entry = { id: string; delta: number; reason: string; createdAt: string };

export default function PointHistoryStrip({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-slate-400">Chưa có lịch sử điểm.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {entries.map((e) => (
        <li
          key={e.id}
          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm"
        >
          <div className="min-w-0">
            <p className="truncate text-sm text-slate-700">{e.reason}</p>
            <p className="text-xs text-slate-400">
              {new Date(e.createdAt).toLocaleString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-sm font-bold ${
              e.delta > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
            }`}
          >
            {e.delta > 0 ? `+${e.delta}` : e.delta}
          </span>
        </li>
      ))}
    </ul>
  );
}
