"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Corners from "@/components/Corners";

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
    <div className="blueprint relative flex flex-wrap items-end gap-3 border border-divider bg-surface p-4">
      <Corners />
      <div>
        <label className="block text-xs text-ink/60">Từ ngày</label>
        <input
          type="date"
          value={fromVal}
          onChange={(e) => setFromVal(e.target.value)}
          className="border border-divider bg-canvas px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-ink/60">Đến ngày</label>
        <input
          type="date"
          value={toVal}
          onChange={(e) => setToVal(e.target.value)}
          className="border border-divider bg-canvas px-2 py-1.5 text-sm"
        />
      </div>
      <button onClick={apply} className="border border-accent-700 bg-accent-700 px-4 py-1.5 text-sm font-semibold text-canvas">
        Lọc
      </button>
      {(from || to) && (
        <button onClick={clear} className="text-sm text-ink/40 hover:text-ink">
          Xóa lọc
        </button>
      )}
    </div>
  );
}
