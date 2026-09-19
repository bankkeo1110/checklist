"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Corners from "@/components/Corners";

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
    <div className="blueprint relative border border-divider bg-surface p-4">
      <Corners />
      <p className="text-xs font-semibold uppercase tracking-wide text-accent-700">Mục tiêu tuần này</p>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSaved(false);
        }}
        rows={2}
        placeholder="Ví dụ: Hoàn thành bài tập đúng giờ mỗi ngày"
        className="mt-2 w-full resize-none border border-divider bg-canvas px-3 py-2 text-sm"
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          disabled={saving}
          onClick={save}
          className="border border-divider px-4 py-1.5 text-sm font-semibold hover:bg-accent-100 disabled:opacity-50"
        >
          {saving ? "Đang lưu…" : "Lưu mục tiêu"}
        </button>
        {saved && <span className="text-xs font-semibold text-accent-700">Đã lưu ✓</span>}
      </div>
    </div>
  );
}
