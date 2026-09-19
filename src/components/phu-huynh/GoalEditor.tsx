"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function GoalEditor({
  childId,
  weekStart,
  initialGoalText,
}: {
  childId: string;
  weekStart: string;
  initialGoalText: string;
}) {
  const router = useRouter();
  const [text, setText] = useState(initialGoalText);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, weekStart, goalText: text }),
      });
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">Mục tiêu tuần này</p>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSaved(false);
        }}
        rows={2}
        placeholder="Ví dụ: Hoàn thành bài tập đúng giờ mỗi ngày"
        className="mt-2 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          disabled={saving}
          onClick={save}
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Đang lưu…" : "Lưu mục tiêu"}
        </button>
        {saved && <span className="text-xs text-emerald-600">Đã lưu ✓</span>}
      </div>
    </div>
  );
}
