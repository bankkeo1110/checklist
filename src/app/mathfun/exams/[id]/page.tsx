"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import MathText from "@/components/mathfun/MathText";

type QuestionType = "single" | "multi" | "fill" | "choose";

interface SafeQuestion {
  type: QuestionType;
  skill: string;
  content: string;
  choices?: string[];
  blankCount?: number;
  dropdowns?: { options: string[] }[];
}

interface SafeExam {
  id: string;
  title: string;
  durationMinutes: number;
  questions: SafeQuestion[];
}

interface SubmitResult {
  correct: number;
  total: number;
  bySkill: Record<string, { correct: number; total: number }>;
  answers: Record<number, { given: unknown; isCorrect: boolean; correctAnswer: string }>;
}

type Answer = number | number[] | string[] | undefined;

export default function TakeExamPage() {
  const { id } = useParams<{ id: string }>();
  const [exam, setExam] = useState<SafeExam | null>(null);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/mathfun/exams/${id}`)
      .then((r) => r.json())
      .then((d) => setExam(d.exam ?? null));
  }, [id]);

  function setBlank(qIndex: number, blankIndex: number, value: string) {
    setAnswers((a) => {
      const current = (a[qIndex] as string[] | undefined) ?? [];
      const next = [...current];
      next[blankIndex] = value;
      return { ...a, [qIndex]: next };
    });
  }

  function toggleMulti(qIndex: number, choiceIndex: number) {
    setAnswers((a) => {
      const current = (a[qIndex] as number[] | undefined) ?? [];
      const next = current.includes(choiceIndex) ? current.filter((i) => i !== choiceIndex) : [...current, choiceIndex];
      return { ...a, [qIndex]: next };
    });
  }

  async function submit() {
    if (!exam) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/mathfun/exams/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Không nộp được bài.");
        return;
      }
      setResult(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Lỗi kết nối. Thử lại nhé.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!exam) return <div className="text-center py-20 text-2xl">Đang tải… ⏳</div>;

  const answeredCount = exam.questions.filter((_, i) => {
    const a = answers[i];
    return a !== undefined && (!Array.isArray(a) || a.every((x) => x !== undefined && x !== ""));
  }).length;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link href="/mathfun/exams" className="card-comic-sm bg-white font-black text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
          ← Danh sách đề
        </Link>
        <h1 className="font-black text-xl text-center">{exam.title}</h1>
        <span className="text-sm font-bold text-gray-400">{exam.durationMinutes} phút</span>
      </div>

      {result && (
        <div className="card-comic bg-white rounded-2xl p-6 mb-5 text-center">
          <div className="text-6xl mb-2">{result.correct === result.total ? "🏆" : result.correct / result.total >= 0.7 ? "🎉" : "💪"}</div>
          <p className="font-black text-2xl">
            Kết quả: {result.correct}/{result.total} ({Math.round((result.correct / result.total) * 100)}%)
          </p>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-left">
            {Object.entries(result.bySkill).map(([skill, s]) => (
              <div key={skill} className={`rounded-xl border-2 px-2.5 py-1.5 text-xs font-bold ${s.correct === s.total ? "border-green-300 bg-green-50 text-green-700" : "border-amber-300 bg-amber-50 text-amber-800"}`}>
                {skill}: {s.correct}/{s.total}
              </div>
            ))}
          </div>
          <Link
            href="/mathfun/learn"
            className="mt-4 inline-block card-comic-sm bg-[#4A6CF7] text-white font-black py-2.5 px-5 rounded-xl hover:opacity-90 transition"
          >
            🌱 Ôn lại kĩ năng còn yếu
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {exam.questions.map((q, i) => {
          const qResult = result?.answers[i];
          const borderClass = qResult ? (qResult.isCorrect ? "border-green-400" : "border-red-400") : "border-transparent";
          return (
            <div key={i} className={`card-comic bg-white rounded-2xl p-5 border-4 ${borderClass}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-black text-blue-600">Câu {i + 1}</span>
                <span className="text-xs text-gray-400">{q.skill}</span>
                {qResult && <span className="ml-auto text-xl">{qResult.isCorrect ? "✅" : "❌"}</span>}
              </div>

              <MathText
                content={q.content}
                renderBlank={
                  q.type === "fill"
                    ? (blankIndex) => (
                        <input
                          type="text"
                          disabled={!!result}
                          value={(answers[i] as string[] | undefined)?.[blankIndex] ?? ""}
                          onChange={(e) => setBlank(i, blankIndex, e.target.value)}
                          className="w-24 rounded-lg border-2 border-gray-300 px-2 py-1 text-center font-bold focus:border-blue-400 focus:outline-none disabled:opacity-60"
                        />
                      )
                    : q.type === "choose"
                      ? (blankIndex) => (
                          <select
                            disabled={!!result}
                            value={(answers[i] as string[] | undefined)?.[blankIndex] ?? ""}
                            onChange={(e) => setBlank(i, blankIndex, e.target.value)}
                            className="rounded-lg border-2 border-gray-300 px-2 py-1 font-bold focus:border-blue-400 focus:outline-none disabled:opacity-60"
                          >
                            <option value="" disabled>
                              Chọn…
                            </option>
                            {q.dropdowns?.[blankIndex]?.options.map((opt, oi) => (
                              <option key={oi} value={oi}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )
                      : undefined
                }
              />

              {q.type === "single" && (
                <div className="mt-3 flex flex-col gap-1.5">
                  {q.choices?.map((c, ci) => (
                    <label
                      key={ci}
                      className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 cursor-pointer ${
                        answers[i] === ci ? "border-blue-400 bg-blue-50" : "border-gray-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q${i}`}
                        disabled={!!result}
                        checked={answers[i] === ci}
                        onChange={() => setAnswers((a) => ({ ...a, [i]: ci }))}
                      />
                      <MathText content={c} />
                    </label>
                  ))}
                </div>
              )}

              {q.type === "multi" && (
                <div className="mt-3 flex flex-col gap-1.5">
                  {q.choices?.map((c, ci) => (
                    <label
                      key={ci}
                      className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 cursor-pointer ${
                        (answers[i] as number[] | undefined)?.includes(ci) ? "border-blue-400 bg-blue-50" : "border-gray-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={!!result}
                        checked={(answers[i] as number[] | undefined)?.includes(ci) ?? false}
                        onChange={() => toggleMulti(i, ci)}
                      />
                      <MathText content={c} />
                    </label>
                  ))}
                </div>
              )}

              {qResult && !qResult.isCorrect && (
                <p className="mt-3 text-sm font-bold text-green-700">
                  Đáp án đúng: <MathText content={qResult.correctAnswer} />
                </p>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="mt-4 text-center font-bold text-red-500">{error}</p>}

      {!result && (
        <div className="sticky bottom-4 mt-6 flex justify-center">
          <button
            onClick={submit}
            disabled={submitting}
            className="card-comic bg-[#FFD015] text-[#1a1a1a] font-black px-8 py-3.5 rounded-xl text-lg hover:bg-yellow-300 transition disabled:opacity-60"
          >
            {submitting ? "Đang nộp…" : `✅ Nộp bài (${answeredCount}/${exam.questions.length} câu đã làm)`}
          </button>
        </div>
      )}

      {result && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => {
              setResult(null);
              setAnswers({});
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="card-comic-sm bg-white text-[#1a1a1a] font-black py-2.5 px-5 rounded-xl hover:bg-gray-50 transition"
          >
            🔄 Làm lại đề này
          </button>
        </div>
      )}
    </div>
  );
}
