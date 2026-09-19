"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Item = { id: string; label: string; active: boolean };

export default function BedtimeItemManager({ initialItems }: { initialItems: Item[] }) {
  const router = useRouter();
  const [newLabel, setNewLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function createItem() {
    if (!newLabel.trim()) return;
    setCreating(true);
    try {
      await fetch("/api/bedtime-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel.trim() }),
      });
      setNewLabel("");
      router.refresh();
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(item: Item) {
    setBusyId(item.id);
    try {
      await fetch(`/api/bedtime-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !item.active }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function deleteItem(item: Item) {
    setBusyId(item.id);
    try {
      await fetch(`/api/bedtime-items/${item.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-600">Thêm mục mới</h2>
        <div className="flex gap-3">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Nội dung mục checklist"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            disabled={creating || !newLabel.trim()}
            onClick={createItem}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            + Thêm
          </button>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {initialItems.map((item) => (
          <li
            key={item.id}
            className={`flex items-center justify-between rounded-xl border bg-white px-4 py-3 shadow-sm ${
              item.active ? "border-slate-200" : "border-slate-100 opacity-60"
            }`}
          >
            <span className="text-sm text-slate-700">{item.label}</span>
            <div className="flex gap-2">
              <button
                disabled={busyId === item.id}
                onClick={() => toggleActive(item)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
              >
                {item.active ? "Tạm ẩn" : "Kích hoạt lại"}
              </button>
              <button
                disabled={busyId === item.id}
                onClick={() => deleteItem(item)}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
              >
                Xóa
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
