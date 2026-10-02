"use client";

import { useEffect, useMemo, useState } from "react";
import { SKILL_NOTES } from "@/lib/mathfun/exams/skills";
import MathText from "@/components/mathfun/MathText";

interface ExamSummary {
  id: string;
  skills: { label: string; count: number }[];
}

interface Attempt {
  bySkill: Record<string, { correct: number; total: number }>;
}

export default function LearnPage() {
  const [exams, setExams] = useState<ExamSummary[] | null>(null);
  const [attempts, setAttempts] = useState<Attempt[] | null>(null);

  useEffect(() => {
    fetch("/api/mathfun/exams")
      .then((r) => r.json())
      .then((d) => setExams(d.exams ?? []));
    fetch("/api/mathfun/exams/attempts")
      .then((r) => r.json())
      .then((d) => setAttempts(d.attempts ?? []));
  }, []);

  const skillStats = useMemo(() => {
    const labels = new Set<string>();
    for (const e of exams ?? []) for (const s of e.skills) labels.add(s.label);
    for (const label of Object.keys(SKILL_NOTES)) labels.add(label);

    const stats = new Map<string, { correct: number; total: number }>();
    for (const label of labels) stats.set(label, { correct: 0, total: 0 });
    for (const a of attempts ?? []) {
      for (const [label, s] of Object.entries(a.bySkill)) {
        const cur = stats.get(label) ?? { correct: 0, total: 0 };
        cur.correct += s.correct;
        cur.total += s.total;
        stats.set(label, cur);
      }
    }

    return [...stats.entries()]
      .map(([label, s]) => ({ label, ...s, accuracy: s.total ? s.correct / s.total : null }))
      .sort((a, b) => {
        // Untried skills float to the middle; weakest-tried skills come first so a kid sees what to review.
        if (a.accuracy === null && b.accuracy === null) return a.label.localeCompare(b.label);
        if (a.accuracy === null) return 1;
        if (b.accuracy === null) return -1;
        return a.accuracy - b.accuracy;
      });
  }, [exams, attempts]);

  const loading = exams === null || attempts === null;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-blue-700 mb-2">🌱 Học thêm</h1>
        <p className="text-gray-500">Các kĩ năng trong đề thi — làm bài càng nhiều, danh sách bên dưới càng biết con cần ôn gì.</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-2xl">Đang tải… ⏳</div>
      ) : (
        <div className="flex flex-col gap-3">
          {skillStats.map((s) => {
            const weak = s.accuracy !== null && s.accuracy < 0.7;
            return (
              <div
                key={s.label}
                className={`rounded-2xl border-2 p-4 ${weak ? "border-amber-300 bg-amber-50" : "border-gray-100 bg-white"}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                  <h2 className="font-bold text-gray-800">{s.label}</h2>
                  {s.accuracy !== null ? (
                    <span className={`text-sm font-black ${weak ? "text-amber-700" : "text-green-600"}`}>
                      {s.correct}/{s.total} đúng ({Math.round(s.accuracy * 100)}%){weak && " — nên ôn lại"}
                    </span>
                  ) : (
                    <span className="text-sm font-semibold text-gray-400">Chưa làm bài nào</span>
                  )}
                </div>
                {SKILL_NOTES[s.label] ? (
                  <div className="text-sm text-gray-600 leading-relaxed [&_p]:m-0">
                    <MathText content={SKILL_NOTES[s.label]} />
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Chưa có ghi chú cho kĩ năng này.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
