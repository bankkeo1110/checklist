'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Analysis, KindStat } from '@/lib/mathfun/analysis';

interface Resp {
  students: { id: number; name: string }[];
  studentId: number;
  name: string;
  days: string;
  rangeLabel: string;
  analysis: Analysis | null;
  markdown: string;
  error?: string;
}

const RANGES: [string, string][] = [['7', '7 ngày'], ['30', '30 ngày'], ['0', 'Tất cả']];

const accColor = (acc: number) => (acc >= 85 ? 'bg-green-500' : acc >= 70 ? 'bg-yellow-400' : 'bg-red-400');

function KindRow({ k }: { k: KindStat }) {
  return (
    <div className="card-comic-sm rounded-xl bg-white px-3 py-2">
      <div className="flex items-center gap-2 text-sm font-black">
        <span className="flex-1 min-w-0">{k.thinking ? '🧠 ' : ''}{k.kind}<span className="block text-[11px] font-bold text-gray-400">{k.lesson}</span></span>
        <span className="text-green-600 shrink-0">✓ {k.correct}</span>
        <span className={`shrink-0 ${k.total - k.correct ? 'text-red-500' : 'text-gray-300'}`}>✗ {k.total - k.correct}</span>
        <span className="w-11 text-right shrink-0">{k.acc}%</span>
      </div>
      <div className="h-1.5 mt-1 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${accColor(k.acc)}`} style={{ width: `${k.acc}%` }} />
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  const [days, setDays] = useState('30');
  const [studentId, setStudentId] = useState<number | null>(null);
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async (d: string, sid: number | null) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ days: d, ...(sid ? { studentId: String(sid) } : {}) });
      const res = await fetch(`/api/mathfun/analysis?${q}`);
      setData(await res.json());
    } catch {
      setData({ error: 'Không tải được dữ liệu.' } as Resp);
    }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on filter change
  useEffect(() => { void load(days, studentId); }, [days, studentId, load]);

  const copy = async () => {
    if (!data?.markdown) return;
    try {
      await navigator.clipboard.writeText(data.markdown);
    } catch {
      // Older browsers / no permission: fall back to a hidden textarea.
      const ta = document.createElement('textarea');
      ta.value = data.markdown; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const download = () => {
    if (!data?.markdown) return;
    const blob = new Blob([data.markdown], { type: 'text/markdown;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `phan-tich-toan-${(data.name || 'be').toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const a = data?.analysis;
  const kinds = a ? (showAll ? a.byKind : a.byKind.slice(0, 12)) : [];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="font-black text-3xl tracking-wide">📈 PHÂN TÍCH HỌC TẬP</h1>
          <p className="font-semibold text-gray-500">{data?.name ? `Bé ${data.name} · ` : ''}điểm mạnh, điểm yếu theo từng dạng toán</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {data?.students && data.students.length > 0 && (
            <select value={data.studentId} onChange={(e) => setStudentId(Number(e.target.value))}
              className="card-comic-sm rounded-xl bg-white px-3 py-2 font-black text-sm">
              {data.students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <div className="card-comic-sm rounded-xl bg-white p-1 flex gap-1">
            {RANGES.map(([v, label]) => (
              <button key={v} onClick={() => setDays(v)}
                className={`px-3 py-1 rounded-lg font-black text-sm ${days === v ? 'bg-[#FFD015]' : 'hover:bg-gray-100'}`}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      {loading && <p className="text-center font-black text-gray-400 py-10">Đang phân tích… ⏳</p>}
      {!loading && data?.error && <p className="text-center font-black text-red-500 py-10">{data.error}</p>}
      {!loading && a && a.answered === 0 && (
        <div className="card-comic bg-white rounded-2xl p-8 text-center font-bold text-gray-500">
          Chưa có câu trả lời nào trong {data?.rangeLabel}. Làm vài bài rồi quay lại xem nhé!
        </div>
      )}

      {!loading && a && a.answered > 0 && (
        <>
          {/* Export for Claude */}
          <div className="card-comic bg-purple-600 text-white rounded-2xl p-5 mb-5">
            <h2 className="font-black text-xl mb-1">🤖 Nhờ Claude phân tích chi tiết</h2>
            <p className="text-purple-100 font-semibold text-sm mb-3">
              Bấm <b>Sao chép báo cáo</b>, mở Claude, dán vào ô chat rồi gửi. Báo cáo đã kèm sẵn yêu cầu: chỉ ra điểm mạnh, điểm yếu, nguyên nhân hay sai và kế hoạch ôn 2 tuần cho bé.
            </p>
            <div className="flex flex-wrap gap-2">
              <button onClick={copy} className="card-comic-sm bg-[#FFD015] text-[#1a1a1a] font-black px-4 py-2 rounded-xl">
                {copied ? '✅ Đã sao chép!' : '📋 Sao chép báo cáo'}
              </button>
              <a href="https://claude.ai/new" target="_blank" rel="noopener noreferrer"
                className="card-comic-sm bg-white text-purple-700 font-black px-4 py-2 rounded-xl">↗ Mở Claude</a>
              <button onClick={download} className="card-comic-sm bg-white/15 text-white font-black px-4 py-2 rounded-xl">⬇️ Tải file .md</button>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 text-center">
            {[
              ['Câu đã làm', String(a.answered), 'bg-white'],
              ['Đúng', `${a.acc}%`, a.acc >= 85 ? 'bg-green-100' : a.acc >= 70 ? 'bg-yellow-100' : 'bg-red-100'],
              ['Bài hoàn thành', String(a.finished), 'bg-white'],
              ['Câu tư duy đúng', a.thinking.total ? `${a.thinking.acc}%` : '–', 'bg-purple-100'],
            ].map(([label, val, bg]) => (
              <div key={label} className={`card-comic-sm rounded-xl p-3 ${bg}`}>
                <div className="font-black text-2xl">{val}</div>
                <div className="text-xs font-black text-gray-500">{label}</div>
              </div>
            ))}
          </div>

          {/* Weak / strong */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className="card-comic bg-red-50 rounded-2xl p-4">
              <h2 className="font-black text-lg mb-2">⚠️ Cần luyện thêm</h2>
              {a.weak.length ? <div className="flex flex-col gap-1.5">{a.weak.slice(0, 6).map((k) => <KindRow key={k.kind} k={k} />)}</div>
                : <p className="text-sm font-semibold text-gray-500">Chưa thấy dạng nào yếu rõ rệt (cần ít nhất 3 câu một dạng để kết luận).</p>}
            </div>
            <div className="card-comic bg-green-50 rounded-2xl p-4">
              <h2 className="font-black text-lg mb-2">⭐ Làm tốt</h2>
              {a.strong.length ? <div className="flex flex-col gap-1.5">{a.strong.slice(0, 6).map((k) => <KindRow key={k.kind} k={k} />)}</div>
                : <p className="text-sm font-semibold text-gray-500">Làm thêm bài để thấy dạng nào bé vững nhất.</p>}
            </div>
          </div>

          {/* By lesson */}
          <div className="card-comic bg-white rounded-2xl p-4 mb-5">
            <h2 className="font-black text-lg mb-2">🗺️ Theo bài học</h2>
            <div className="flex flex-col gap-1.5">
              {a.byLesson.map((l) => (
                <div key={l.topic} className="flex items-center gap-2 text-sm font-bold">
                  <span className="w-12 shrink-0 text-gray-400">{l.island ? `Đảo ${l.island}` : ''}</span>
                  <span className="flex-1 min-w-0 truncate">{l.label}</span>
                  <span className="w-16 text-right shrink-0 text-gray-500">{l.correct}/{l.total}</span>
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden shrink-0"><div className={`h-full ${accColor(l.acc)}`} style={{ width: `${l.acc}%` }} /></div>
                  <span className="w-10 text-right shrink-0 font-black">{l.acc}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* By kind */}
          <div className="card-comic bg-white rounded-2xl p-4 mb-5">
            <h2 className="font-black text-lg mb-2">🧩 Theo dạng toán <span className="text-sm text-gray-400">(sai nhiều xếp trước)</span></h2>
            <div className="flex flex-col gap-1.5">{kinds.map((k) => <KindRow key={k.kind} k={k} />)}</div>
            {a.byKind.length > 12 && (
              <button onClick={() => setShowAll((v) => !v)} className="mt-2 text-sm font-black text-blue-600 underline">
                {showAll ? 'Thu gọn' : `Xem cả ${a.byKind.length} dạng`}
              </button>
            )}
          </div>

          {/* Recent mistakes */}
          {a.recentWrong.length > 0 && (
            <details className="card-comic bg-white rounded-2xl p-4 mb-5">
              <summary className="font-black text-lg cursor-pointer">❌ {a.recentWrong.length} câu sai gần nhất</summary>
              <ol className="mt-3 flex flex-col gap-2 text-sm">
                {a.recentWrong.map((r, i) => (
                  <li key={i} className="rounded-lg p-2 border border-red-200 bg-red-50">
                    <div className="text-[11px] font-black text-gray-400">{r.kind ?? r.topic}{r.isRetry ? ' · lần làm lại' : ''}</div>
                    <div className="font-semibold text-gray-800">{r.question}</div>
                    <div className="font-black mt-0.5"><span className="text-red-500">Chọn: {r.studentAnswer}</span> · <span className="text-green-600">Đúng: {r.correctAnswer}</span></div>
                  </li>
                ))}
              </ol>
            </details>
          )}

          <p className="text-xs font-semibold text-gray-400 text-center mb-8">
            Dạng toán được ghi lại từ khi có tính năng này; các câu làm trước đó được gom theo bài học (“Chưa phân dạng”).
          </p>
        </>
      )}
    </div>
  );
}
