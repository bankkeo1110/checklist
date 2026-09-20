"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import Spinner from "@/components/Spinner";
import StarPicker from "@/components/StarPicker";
import { DEFAULT_STARS } from "@/lib/stars";

type Item = { id: string; label: string; points: number; active: boolean };

export default function WakeupItemManager({ initialItems }: { initialItems: Item[] }) {
  const router = useRouter();
  const [newLabel, setNewLabel] = useState("");
  const [newPoints, setNewPoints] = useState(DEFAULT_STARS);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function createItem() {
    if (!newLabel.trim()) return;
    setCreating(true);
    try {
      await fetch("/api/wakeup-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel.trim(), points: newPoints }),
      });
      setNewLabel("");
      setNewPoints(DEFAULT_STARS);
      router.refresh();
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(item: Item) {
    setBusyId(item.id);
    try {
      await fetch(`/api/wakeup-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !item.active }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function updatePoints(item: Item, points: number) {
    setBusyId(item.id);
    try {
      await fetch(`/api/wakeup-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function deleteItem(item: Item) {
    setBusyId(item.id);
    try {
      await fetch(`/api/wakeup-items/${item.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-2.5 rounded-[20px] bg-white p-3 shadow-md">
        <div className="flex items-center gap-2.5">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Nội dung mục checklist"
            className="flex-1 rounded-2xl border-2 border-divider px-3.5 py-2.5 text-sm font-semibold focus:border-blue focus:outline-none"
          />
          <button
            disabled={creating || !newLabel.trim()}
            onClick={createItem}
            className="flex flex-none items-center gap-1.5 rounded-2xl px-4 py-2.5 text-[13.5px] font-extrabold text-white disabled:opacity-70"
            style={{ background: "linear-gradient(135deg,#FF9F45,#FFC93C)" }}
          >
            {creating && <Spinner size={14} />}
            + Thêm
          </button>
        </div>
        <StarPicker key={`new-${newPoints}`} value={newPoints} onChange={setNewPoints} size={18} />
      </div>

      <ul className="flex flex-col gap-2">
        {initialItems.map((item) => (
          <li
            key={item.id}
            className={`flex flex-col gap-2 rounded-2xl bg-white px-3.5 py-3 shadow-md ${
              item.active ? "" : "opacity-50"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="flex-1 text-sm font-bold">{item.label}</span>
              <button
                disabled={busyId === item.id}
                onClick={() => toggleActive(item)}
                className="flex items-center gap-1.5 rounded-full bg-divider px-3 py-1.5 text-[11.5px] font-bold text-muted"
              >
                {busyId === item.id && <Spinner size={12} />}
                {item.active ? "Tạm ẩn" : "Kích hoạt lại"}
              </button>
              <button
                disabled={busyId === item.id}
                onClick={() => deleteItem(item)}
                aria-label="Xóa"
                className="p-0.5 text-[#c7c3cc] hover:text-muted"
              >
                {busyId === item.id ? <Spinner size={15} /> : <Trash2 size={15} strokeWidth={2} />}
              </button>
            </div>
            <StarPicker
              key={item.points}
              value={item.points}
              disabled={busyId === item.id}
              onChange={(p) => updatePoints(item, p)}
              size={18}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
