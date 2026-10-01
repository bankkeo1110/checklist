'use client';

import { useEffect, useRef, useState } from 'react';
import ChineseKeyboard from '@/components/mathfun/ChineseKeyboard';

type Lang = 'vi' | 'zh';

interface Result {
  source: string;
  from: Lang;
  to: Lang;
  translation: string;
  pinyin: string;
  alternatives: string[];
}

const LABEL: Record<Lang, string> = { vi: 'Tiếng Việt 🇻🇳', zh: '中文 🇨🇳' };

export default function DictionaryPage() {
  const [from, setFrom] = useState<Lang>('vi');
  const to: Lang = from === 'vi' ? 'zh' : 'vi';

  const [text, setText] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const zhVoice = useRef<SpeechSynthesisVoice | null>(null);

  // Pick a Chinese voice once voices are available.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const pick = () => {
      const voices = window.speechSynthesis.getVoices();
      zhVoice.current =
        voices.find((v) => /zh[-_]?CN/i.test(v.lang)) ??
        voices.find((v) => v.lang.toLowerCase().startsWith('zh')) ??
        null;
    };
    pick();
    window.speechSynthesis.onvoiceschanged = pick;
  }, []);

  const swap = () => {
    setFrom(to);
    // When the input side becomes Chinese, open the virtual keyboard.
    setShowKeyboard(to === 'zh');
    setText(result?.translation ?? '');
    setResult(null);
    setError('');
  };

  const speak = (t: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !t) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'zh-CN';
    if (zhVoice.current) u.voice = zhVoice.current;
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  };

  const lookup = async () => {
    const q = text.trim();
    if (!q) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(
        `/api/mathfun/dictionary?q=${encodeURIComponent(q)}&from=${from}&to=${to}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? 'Không tra được, thử lại nhé.');
      } else {
        setResult(data);
        // Auto-play the Chinese pronunciation.
        const zh = to === 'zh' ? data.translation : q;
        setTimeout(() => speak(zh), 150);
      }
    } catch {
      setError('Lỗi kết nối. Kiểm tra mạng rồi thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const chineseResult = result
    ? result.to === 'zh'
      ? result.translation
      : result.source
    : '';

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-700 mb-6 text-center">
        📖 Từ điển Việt – Trung
      </h1>

      {/* Direction selector */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <span className="font-semibold text-gray-700">{LABEL[from]}</span>
        <button
          onClick={swap}
          className="text-2xl hover:scale-110 transition"
          title="Đổi chiều dịch"
        >
          🔄
        </button>
        <span className="font-semibold text-gray-700">{LABEL[to]}</span>
      </div>

      {/* Input */}
      <div className="bg-white rounded-2xl shadow p-4 mb-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              lookup();
            }
          }}
          rows={2}
          placeholder={
            from === 'vi' ? 'Nhập từ tiếng Việt…' : '输入中文… (dùng bàn phím ảo bên dưới)'
          }
          className="w-full resize-none border-2 border-gray-200 rounded-xl px-3 py-2 text-lg focus:outline-none focus:border-blue-400"
        />
        <div className="flex gap-2 mt-3">
          <button
            onClick={lookup}
            disabled={loading || !text.trim()}
            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-bold py-2.5 rounded-xl transition"
          >
            {loading ? 'Đang tra… ⏳' : '🔍 Tra từ'}
          </button>
          <button
            onClick={() => setShowKeyboard((s) => !s)}
            className={`px-4 rounded-xl font-bold transition border-2 ${
              showKeyboard
                ? 'bg-blue-100 border-blue-400 text-blue-700'
                : 'border-gray-200 text-gray-500 hover:border-blue-300'
            }`}
            title="Bàn phím tiếng Trung"
          >
            ⌨️ 中
          </button>
        </div>
      </div>

      {showKeyboard && (
        <ChineseKeyboard
          onCommit={(ch) => setText((t) => t + ch)}
          onBackspaceTarget={() => setText((t) => t.slice(0, -1))}
        />
      )}

      {error && (
        <div className="mt-4 bg-red-50 border-2 border-red-200 text-red-600 rounded-2xl p-4 text-center font-semibold">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-4 bg-white rounded-3xl shadow-lg p-6">
          <p className="text-sm text-gray-400 mb-1">{LABEL[result.from]} → {LABEL[result.to]}</p>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-3xl font-bold text-gray-800 leading-snug">
                {result.translation}
              </p>
              {result.pinyin && (
                <p className="text-lg text-blue-500 mt-1">🔊 {result.pinyin}</p>
              )}
            </div>
            <button
              onClick={() => speak(chineseResult)}
              className="shrink-0 bg-green-500 hover:bg-green-600 text-white rounded-full w-14 h-14 text-2xl shadow transition"
              title="Nghe phát âm"
            >
              🔊
            </button>
          </div>

          {result.alternatives.length > 0 && (
            <div className="mt-4 border-t pt-3">
              <p className="text-sm font-semibold text-gray-500 mb-2">Cách dịch khác:</p>
              <ul className="space-y-1">
                {result.alternatives.map((a, i) => (
                  <li key={i} className="text-gray-700">
                    • {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-gray-400">
        Dịch bởi MyMemory · Phiên âm & giọng đọc chạy trong trình duyệt
      </p>
    </div>
  );
}
