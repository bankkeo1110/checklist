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
    <div className="flex flex-wrap items-end gap-3 rounded-[20px] bg-white p-4 shadow-md">
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold text-muted">Từ ngày</label>
        <input
          type="date"
          value={fromVal}
          onChange={(e) => setFromVal(e.target.value)}
          className="rounded-xl border-2 border-divider px-2.5 py-2 text-[12.5px] font-semibold"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold text-muted">Đến ngày</label>
        <input
          type="date"
          value={toVal}
          onChange={(e) => setToVal(e.target.value)}
          className="rounded-xl border-2 border-divider px-2.5 py-2 text-[12.5px] font-semibold"
        />
      </div>
      <button onClick={apply} className="rounded-2xl bg-blue px-4 py-2 text-[13px] font-extrabold text-white">
        Lọc
      </button>
      {(from || to) && (
        <button onClick={clear} className="pb-2 text-[12px] font-bold text-muted hover:text-ink">
          Xóa lọc
        </button>
      )}
    </div>
  );
}
