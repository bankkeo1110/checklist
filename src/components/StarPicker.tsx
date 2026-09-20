"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { MIN_STARS, MAX_STARS } from "@/lib/stars";

export default function StarPicker({
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
