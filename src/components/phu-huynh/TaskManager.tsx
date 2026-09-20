"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { DEFAULT_STARS, MIN_STARS, MAX_STARS } from "@/lib/stars";
import { personTheme } from "@/lib/personTheme";

type Task = { id: string; title: string; points: number; active: boolean; childIds: string[] };
type Kid = { id: string; label: string; name: string };

function StarPicker({
  value,
  onChange,
  disabled,
  size = 22,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
  size?: number;
}) {
  const [text, setText] = useState(String(value));

  function commit() {
    const n = parseInt(text, 10);
    if (Number.isInteger(n) && n >= MIN_STARS && n <= MAX_STARS) {
      if (n !== value) onChange(n);
    } else {
      setText(String(value));
    }
  }

  return (
    <div className="flex items-center gap-1.5 text-yellow">
      <Star size={size} strokeWidth={1.6} fill="currentColor" />
      <input
        type="number"
        inputMode="numeric"
        min={MIN_STARS}
        max={MAX_STARS}
        value={text}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        aria-label="Số sao"
        className="w-16 rounded-xl border-2 border-divider px-2 py-1 text-sm font-bold text-ink focus:border-blue focus:outline-none disabled:opacity-50"
      />
    </div>
  );
}

function ChildChip({
  kid,
  active,
  onClick,
  disabled,
}: {
  kid: Kid;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  const theme = personTheme(kid.name);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full px-3.5 py-1.5 text-xs font-bold disabled:opacity-50"
      style={
        active
          ? { background: theme.tint, color: theme.text }
          : { background: "var(--color-divider)", color: "var(--color-muted)" }
      }
    >
      {kid.label}
    </button>
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3.5 rounded-[22px] bg-white p-4 shadow-md">
        <p className="font-display text-[15px] font-bold">✨ Thêm nhiệm vụ mới</p>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-muted">Tên nhiệm vụ</label>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Ví dụ: Đọc sách 30 phút"
            className="rounded-2xl border-2 border-divider px-3.5 py-2.5 text-sm font-semibold focus:border-blue focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-muted">Số sao</label>
          <StarPicker key={`new-${newPoints}`} value={newPoints} onChange={setNewPoints} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-muted">Giao cho</label>
          <div className="flex gap-2">
            {kids.map((k) => (
              <ChildChip key={k.id} kid={k} active={newChildIds.includes(k.id)} onClick={() => toggleNewChild(k.id)} />
            ))}
          </div>
        </div>
        {error && <p className="text-sm font-semibold text-coral-text">{error}</p>}
        <button
          disabled={creating || !newTitle.trim() || newChildIds.length === 0}
          onClick={createTask}
          className="rounded-2xl py-3 text-[14.5px] font-extrabold text-white shadow-md disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#FF9F45,#FF6B6B)" }}
        >
          {creating ? "Đang thêm…" : "+ Thêm nhiệm vụ"}
        </button>
      </div>

      <ul className="flex flex-col gap-2.5">
        {initialTasks.map((task) => (
          <li
            key={task.id}
            className={`flex flex-col gap-2.5 rounded-[20px] bg-white p-3.5 shadow-md ${task.active ? "" : "opacity-50"}`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-bold">{task.title}</p>
              <button
                disabled={busyId === task.id}
                onClick={() => deleteTask(task)}
                aria-label="Xóa"
                className="flex-none p-0.5 text-[#c7c3cc] hover:text-muted"
              >
                <Trash2 size={15} strokeWidth={2} />
              </button>
            </div>
            <StarPicker
              key={task.points}
              value={task.points}
              disabled={busyId === task.id}
              onChange={(p) => updatePoints(task, p)}
              size={19}
            />
            <div className="flex flex-wrap items-center gap-2">
              {kids.map((k) => (
                <ChildChip
                  key={k.id}
                  kid={k}
                  active={task.childIds.includes(k.id)}
                  disabled={busyId === task.id}
                  onClick={() => toggleAssignment(task, k.id)}
                />
              ))}
              <span className="flex-1" />
              <button
                disabled={busyId === task.id}
                onClick={() => toggleActive(task)}
                className="rounded-full bg-divider px-3 py-1.5 text-[11.5px] font-bold text-muted"
              >
                {task.active ? "Tạm ẩn" : "Kích hoạt lại"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
