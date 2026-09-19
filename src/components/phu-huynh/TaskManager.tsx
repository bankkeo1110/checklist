"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { DEFAULT_STARS, MAX_STARS } from "@/lib/stars";
import Corners from "@/components/Corners";

type Task = { id: string; title: string; points: number; active: boolean; childIds: string[] };
type Kid = { id: string; label: string };

function StarPicker({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5 text-accent-700">
      {Array.from({ length: MAX_STARS }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n)}
          aria-label={`${n} sao`}
          className="p-0.5 disabled:opacity-50"
        >
          <Star size={20} strokeWidth={1.5} fill={n <= value ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );
}

export default function TaskManager({ initialTasks, kids }: { initialTasks: Task[]; kids: Kid[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newPoints, setNewPoints] = useState(DEFAULT_STARS);
  const [newChildIds, setNewChildIds] = useState<string[]>(kids.map((k) => k.id));
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleNewChild(id: string) {
    setNewChildIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
  }

  async function createTask() {
    if (!newTitle.trim() || newChildIds.length === 0) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), points: newPoints, childIds: newChildIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Không tạo được.");
        return;
      }
      setNewTitle("");
      setNewPoints(DEFAULT_STARS);
      setNewChildIds(kids.map((k) => k.id));
      router.refresh();
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(task: Task) {
    setBusyId(task.id);
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !task.active }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function updatePoints(task: Task, points: number) {
    setBusyId(task.id);
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function toggleAssignment(task: Task, childId: string) {
    const nextIds = task.childIds.includes(childId)
      ? task.childIds.filter((id) => id !== childId)
      : [...task.childIds, childId];
    if (nextIds.length === 0) return;
    setBusyId(task.id);
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childIds: nextIds }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function deleteTask(task: Task) {
    setBusyId(task.id);
    try {
      await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="blueprint relative border border-divider bg-surface p-4">
        <Corners />
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-accent-700">Thêm nhiệm vụ mới</h2>
        <div className="flex flex-col gap-3">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Tên nhiệm vụ"
            className="border border-divider bg-canvas px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink/60">Số sao:</span>
              <StarPicker value={newPoints} onChange={setNewPoints} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink/60">Giao cho:</span>
              {kids.map((k) => (
                <button
                  key={k.id}
                  onClick={() => toggleNewChild(k.id)}
                  className={`px-3 py-1 text-xs font-semibold ${
                    newChildIds.includes(k.id)
                      ? "bg-accent-100 text-accent-800"
                      : "border border-accent-700 text-accent-700"
                  }`}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-ink">{error}</p>}
          <button
            disabled={creating || !newTitle.trim() || newChildIds.length === 0}
            onClick={createTask}
            className="blueprint relative self-start border border-accent-700 bg-accent-700 px-4 py-2 text-sm font-semibold text-canvas disabled:opacity-50"
          >
            <Corners />
            {creating ? "Đang thêm…" : "+ Thêm nhiệm vụ"}
          </button>
        </div>
      </div>

      <ul className="flex flex-col gap-3">
        {initialTasks.map((task) => (
          <li
            key={task.id}
            className={`blueprint relative border border-divider bg-surface p-4 ${task.active ? "" : "opacity-50"}`}
          >
            <Corners />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium">{task.title}</p>
              <StarPicker value={task.points} disabled={busyId === task.id} onChange={(p) => updatePoints(task, p)} />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {kids.map((k) => (
                  <button
                    key={k.id}
                    disabled={busyId === task.id}
                    onClick={() => toggleAssignment(task, k.id)}
                    className={`px-3 py-1 text-xs font-semibold ${
                      task.childIds.includes(k.id)
                        ? "bg-accent-100 text-accent-800"
                        : "border border-accent-700 text-accent-700"
                    }`}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={busyId === task.id}
                  onClick={() => toggleActive(task)}
                  className="border border-divider px-3 py-1.5 text-xs font-medium text-ink/60 hover:bg-accent-100"
                >
                  {task.active ? "Tạm ẩn" : "Kích hoạt lại"}
                </button>
                <button
                  disabled={busyId === task.id}
                  onClick={() => deleteTask(task)}
                  aria-label="Xóa"
                  className="flex h-8 w-8 items-center justify-center text-ink/50 hover:bg-accent-100"
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
