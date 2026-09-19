"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEFAULT_STARS, MAX_STARS } from "@/lib/stars";

type Task = { id: string; title: string; points: number; active: boolean; childIds: string[] };
type Kid = { id: string; label: string; color: string };

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
    <div className="flex items-center gap-1">
      {Array.from({ length: MAX_STARS }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n)}
          aria-label={`${n} sao`}
          className={`text-xl leading-none disabled:opacity-50 ${n <= value ? "text-amber-400" : "text-slate-200"}`}
        >
          ★
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
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-600">Thêm nhiệm vụ mới</h2>
        <div className="flex flex-col gap-3">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Tên nhiệm vụ"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Số sao:</span>
              <StarPicker value={newPoints} onChange={setNewPoints} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Giao cho:</span>
              {kids.map((k) => (
                <button
                  key={k.id}
                  onClick={() => toggleNewChild(k.id)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    newChildIds.includes(k.id) ? "text-white" : "bg-slate-100 text-slate-400"
                  }`}
                  style={newChildIds.includes(k.id) ? { backgroundColor: k.color } : undefined}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            disabled={creating || !newTitle.trim() || newChildIds.length === 0}
            onClick={createTask}
            className="self-start rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {creating ? "Đang thêm…" : "+ Thêm nhiệm vụ"}
          </button>
        </div>
      </div>

      <ul className="flex flex-col gap-3">
        {initialTasks.map((task) => (
          <li
            key={task.id}
            className={`rounded-2xl border bg-white p-4 shadow-sm ${
              task.active ? "border-slate-200" : "border-slate-100 opacity-60"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold text-slate-800">{task.title}</p>
              <StarPicker
                value={task.points}
                disabled={busyId === task.id}
                onChange={(p) => updatePoints(task, p)}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {kids.map((k) => (
                  <button
                    key={k.id}
                    disabled={busyId === task.id}
                    onClick={() => toggleAssignment(task, k.id)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      task.childIds.includes(k.id) ? "text-white" : "bg-slate-100 text-slate-400"
                    }`}
                    style={task.childIds.includes(k.id) ? { backgroundColor: k.color } : undefined}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={busyId === task.id}
                  onClick={() => toggleActive(task)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
                >
                  {task.active ? "Tạm ẩn" : "Kích hoạt lại"}
                </button>
                <button
                  disabled={busyId === task.id}
                  onClick={() => deleteTask(task)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                >
                  Xóa
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
