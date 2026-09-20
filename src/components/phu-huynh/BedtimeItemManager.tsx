"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

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
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-2.5 rounded-[20px] bg-white p-3 shadow-md">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Nội dung mục checklist"
          className="flex-1 rounded-2xl border-2 border-divider px-3.5 py-2.5 text-sm font-semibold focus:border-blue focus:outline-none"
        />
        <button
          disabled={creating || !newLabel.trim()}
          onClick={createItem}
          className="flex-none rounded-2xl px-4 py-2.5 text-[13.5px] font-extrabold text-white disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#4D96FF,#6BA8FF)" }}
        >
          + Thêm
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {initialItems.map((item) => (
          <li
            key={item.id}
            className={`flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-3 shadow-md ${
              item.active ? "" : "opacity-50"
            }`}
          >
            <span className="flex-1 text-sm font-bold">{item.label}</span>
            <button
              disabled={busyId === item.id}
              onClick={() => toggleActive(item)}
              className="rounded-full bg-divider px-3 py-1.5 text-[11.5px] font-bold text-muted"
            >
              {item.active ? "Tạm ẩn" : "Kích hoạt lại"}
            </button>
            <button
              disabled={busyId === item.id}
              onClick={() => deleteItem(item)}
              aria-label="Xóa"
              className="p-0.5 text-[#c7c3cc] hover:text-muted"
            >
              <Trash2 size={15} strokeWidth={2} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
