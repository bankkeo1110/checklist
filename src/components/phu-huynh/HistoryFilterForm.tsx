"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HistoryFilterForm({
  childId,
  from,
  to,
}: {
  childId: string;
  from: string;
  to: string;
}) {
  const router = useRouter();
  const [fromVal, setFromVal] = useState(from);
  const [toVal, setToVal] = useState(to);

  function apply() {
    const params = new URLSearchParams({ child: childId });
    if (fromVal) params.set("from", fromVal);
    if (toVal) params.set("to", toVal);
    router.push(`/phu-huynh/lich-su?${params.toString()}`);
  }

  function clear() {
    setFromVal("");
    setToVal("");
    router.push(`/phu-huynh/lich-su?child=${childId}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <label className="block text-xs text-slate-500">Từ ngày</label>
        <input
          type="date"
          value={fromVal}
          onChange={(e) => setFromVal(e.target.value)}
          className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-500">Đến ngày</label>
        <input
          type="date"
          value={toVal}
          onChange={(e) => setToVal(e.target.value)}
          className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
        />
      </div>
      <button
        onClick={apply}
        className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white"
      >
        Lọc
      </button>
      {(from || to) && (
        <button onClick={clear} className="text-sm text-slate-400 hover:text-slate-600">
          Xóa lọc
        </button>
      )}
    </div>
  );
}
