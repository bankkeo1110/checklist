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
    <div className="flex flex-col gap-2 rounded-[20px] bg-white p-4 shadow-md">
      <p className="text-[11.5px] font-bold uppercase tracking-wide text-muted">Mục tiêu tuần này</p>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSaved(false);
        }}
        rows={2}
        placeholder="Ví dụ: Hoàn thành bài tập đúng giờ mỗi ngày"
        className="resize-none rounded-xl border-2 border-divider px-2.5 py-2 text-[13px] font-semibold focus:border-blue focus:outline-none"
      />
      <div className="flex items-center gap-2">
        <button
          disabled={saving}
          onClick={save}
          className="rounded-full bg-divider px-3 py-1.5 text-[11.5px] font-extrabold text-blue disabled:opacity-50"
        >
          {saving ? "Đang lưu…" : "Lưu mục tiêu"}
        </button>
        {saved && <span className="text-[11.5px] font-extrabold text-green">Đã lưu ✓</span>}
      </div>
    </div>
  );
}
