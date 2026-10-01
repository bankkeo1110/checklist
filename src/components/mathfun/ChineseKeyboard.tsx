'use client';

import { useMemo, useState } from 'react';
import { getCandidates, splitPinyin } from '@/lib/mathfun/pinyinIme';

const ROWS = [
  'qwertyuiop'.split(''),
  'asdfghjkl'.split(''),
  'zxcvbnm'.split(''),
];

function Key({
  label,
  onClick,
  wide,
  className = '',
}: {
  label: string;
  onClick: () => void;
  wide?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${wide ? 'px-4' : 'w-8 sm:w-9'} h-11 rounded-lg bg-gray-100 hover:bg-blue-100 active:bg-blue-200 font-semibold text-gray-700 border border-gray-200 transition ${className}`}
    >
      {label}
    </button>
  );
}

interface Props {
  /** Called whenever a hanzi should be appended to the target text. */
  onCommit: (hanzi: string) => void;
  /** Called to remove the last character of the target text (physical backspace). */
  onBackspaceTarget: () => void;
}

/**
 * A lightweight pinyin IME: type pinyin with the on-screen keys, pick a hanzi
 * candidate to commit it. No external service — candidates come from a local
 * pinyin -> hanzi map built with pinyin-pro.
 */
export default function ChineseKeyboard({ onCommit, onBackspaceTarget }: Props) {
  const [buffer, setBuffer] = useState('');

  const candidates = useMemo(() => getCandidates(buffer), [buffer]);

  const typeLetter = (l: string) => setBuffer((b) => b + l);

  const backspace = () => {
    if (buffer) setBuffer((b) => b.slice(0, -1));
    else onBackspaceTarget();
  };

  const pickCandidate = (ch: string) => {
    onCommit(ch);
    // Remove the consumed leading syllable, keep any remaining pinyin.
    setBuffer((b) => splitPinyin(b).rest);
  };

  return (
    <div className="mt-3 rounded-2xl border-2 border-gray-200 bg-white p-3 shadow-sm select-none">
      {/* Pinyin buffer + candidate strip */}
      <div className="flex items-center gap-2 mb-2 min-h-[2.5rem]">
        <span className="text-sm font-mono text-blue-600 min-w-[3rem]">
          {buffer || <span className="text-gray-300">pinyin…</span>}
        </span>
        <div className="flex-1 flex flex-wrap gap-1 overflow-x-auto">
          {candidates.map((ch, i) => (
            <button
              key={ch}
              type="button"
              onClick={() => pickCandidate(ch)}
              className="px-2 h-9 rounded-lg bg-blue-50 hover:bg-blue-200 border border-blue-200 text-lg font-bold text-blue-900 transition"
              title={`候选 ${i + 1}`}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* Letter rows */}
      <div className="flex flex-col items-center gap-1">
        {ROWS.map((row, ri) => (
          <div key={ri} className="flex gap-1">
            {ri === 2 && (
              <Key label="⌫" onClick={backspace} wide className="bg-red-50 hover:bg-red-100 text-red-500" />
            )}
            {row.map((l) => (
              <Key key={l} label={l} onClick={() => typeLetter(l)} />
            ))}
            {ri === 2 && (
              <Key
                label="清"
                onClick={() => setBuffer('')}
                wide
                className="bg-gray-50 text-gray-400"
              />
            )}
          </div>
        ))}
        <div className="flex gap-1 mt-1">
          <Key label="space 空格" onClick={() => onCommit('　')} wide className="px-16" />
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-gray-400">
        Gõ pinyin (vd: ni hao) rồi bấm chọn chữ Hán ở trên
      </p>
    </div>
  );
}
