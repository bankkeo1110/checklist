"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ExamSummary {
  id: string;
  title: string;
  grade: number;
  durationMinutes: number;
  questionCount: number;
  skills: { label: string; count: number }[];
}

interface Attempt {
  id: number;
  studentName: string;
  examId: string;
  examTitle: string;
  correct: number;
  total: number;
  finishedAt: string;
}

export default function ExamsPage() {
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

  const bestFor = (examId: string) => {
    const mine = (attempts ?? []).filter((a) => a.examId === examId);
    if (!mine.length) return null;
    return mine.reduce((best, a) => (a.correct / a.total > best.correct / best.total ? a : best));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-3xl font-bold text-blue-700">📝 Đề thi thử</h1>
        <a
          href="/api/mathfun/exams/export"
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-5 rounded-full transition"
        >
          ⬇️ Xuất kết quả (CSV)
        </a>
      </div>

      {exams === null ? (
        <div className="text-center py-20 text-2xl">Đang tải… ⏳</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {exams.map((e) => {
            const best = bestFor(e.id);
            return (
              <div key={e.id} className="card-comic bg-white rounded-2xl p-5 flex flex-col gap-2">
                <h2 className="font-black text-lg">{e.title}</h2>
                <p className="text-sm text-gray-500">
                  {e.questionCount} câu · {e.durationMinutes} phút · Lớp {e.grade}
                </p>
                {best && (
                  <p className="text-sm font-bold text-green-600">
                    Điểm tốt nhất: {best.correct}/{best.total} ({Math.round((best.correct / best.total) * 100)}%)
                  </p>
                )}
                <Link
                  href={`/mathfun/exams/${e.id}`}
                  className="mt-2 card-comic-sm bg-[#FFD015] text-[#1a1a1a] font-black py-2.5 rounded-xl text-center hover:bg-yellow-300 transition"
                >
                  ▶ Làm bài
                </Link>
              </div>
            );
          })}
        </div>
      )}

      <h2 className="text-xl font-bold text-gray-700 mb-3">🕐 Lịch sử làm bài</h2>
      {attempts === null ? (
        <div className="text-center py-10 text-gray-400">Đang tải…</div>
      ) : attempts.length === 0 ? (
        <p className="text-gray-400">Chưa có lượt làm bài nào.</p>
      ) : (
        <div className="bg-white rounded-2xl shadow p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 text-left text-gray-500">
                <th className="pb-2 pr-3">Học sinh</th>
                <th className="pb-2 pr-3">Đề thi</th>
                <th className="pb-2 pr-3">Điểm</th>
                <th className="pb-2">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => (
                <tr key={a.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 pr-3 font-semibold">{a.studentName}</td>
                  <td className="py-2 pr-3">{a.examTitle}</td>
                  <td className="py-2 pr-3">
                    {a.correct}/{a.total} ({Math.round((a.correct / a.total) * 100)}%)
                  </td>
                  <td className="py-2 text-gray-400">{new Date(a.finishedAt).toLocaleString("vi-VN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
