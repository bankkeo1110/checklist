"use client";

import { useState } from "react";
import Spinner from "@/components/Spinner";

type Entry = { id: string; delta: number; reason: string; createdAt: string };

const PAGE_SIZE = 10;

export default function PointHistoryStrip({
  initialEntries,
  initialHasMore,
}: {
  initialEntries: Entry[];
  initialHasMore: boolean;
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMore() {
    const last = entries.at(-1);
    if (!last || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/points/history?cursor=${encodeURIComponent(last.id)}&take=${PAGE_SIZE}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Không tải được.");
        return;
      }
      setEntries((current) => {
        const seen = new Set(current.map((e) => e.id));
        return [...current, ...(data.entries as Entry[]).filter((e) => !seen.has(e.id))];
      });
      setHasMore(Boolean(data.hasMore));
    } catch {
      setError("Không kết nối được. Thử lại nhé.");
    } finally {
      setLoading(false);
    }
  }

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
      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 border-t border-divider py-3 text-[13px] font-extrabold text-blue-text disabled:opacity-70"
        >
          {loading && <Spinner size={14} />}
          Xem thêm
        </button>
      )}
      {error && <p className="pb-3 text-center text-sm font-semibold text-coral-text">{error}</p>}
    </div>
  );
}
