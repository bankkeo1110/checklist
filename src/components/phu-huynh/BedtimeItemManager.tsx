"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import Corners from "@/components/Corners";

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
      <div className="blueprint relative flex items-center gap-3 border border-divider bg-surface p-4">
        <Corners />
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Nội dung mục checklist"
          className="flex-1 border border-divider bg-canvas px-3 py-2 text-sm"
        />
        <button
          disabled={creating || !newLabel.trim()}
          onClick={createItem}
          className="blueprint relative flex-none border border-accent-700 bg-accent-700 px-4 py-2 text-sm font-semibold text-canvas disabled:opacity-50"
        >
          <Corners />+ Thêm
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {initialItems.map((item) => (
          <li
            key={item.id}
            className={`blueprint relative flex items-center justify-between border border-divider bg-surface px-4 py-3 ${
              item.active ? "" : "opacity-50"
            }`}
          >
            <Corners />
            <span className="text-sm">{item.label}</span>
            <div className="flex items-center gap-2">
              <button
                disabled={busyId === item.id}
                onClick={() => toggleActive(item)}
                className="border border-divider px-3 py-1.5 text-xs font-medium text-ink/60 hover:bg-accent-100"
              >
                {item.active ? "Tạm ẩn" : "Kích hoạt lại"}
              </button>
              <button
                disabled={busyId === item.id}
                onClick={() => deleteItem(item)}
                aria-label="Xóa"
                className="flex h-8 w-8 items-center justify-center text-ink/50 hover:bg-accent-100"
              >
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
