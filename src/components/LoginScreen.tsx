"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Person = {
  kind: "child" | "parent";
  id: string;
  label: string;
  color?: string;
};

export default function LoginScreen({ people }: { people: Person[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Person | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function choose(person: Person) {
    setSelected(person);
    setPin("");
    setError(null);
  }

  function pressDigit(digit: string) {
    if (pin.length >= 6) return;
    setPin((p) => p + digit);
    setError(null);
  }

  function backspace() {
    setPin((p) => p.slice(0, -1));
  }

  async function submit(pinValue: string) {
    if (!selected || pinValue.length < 4) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: selected.kind, id: selected.id, pin: pinValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Có lỗi xảy ra.");
        setPin("");
        setLoading(false);
        return;
      }
      router.push(data.redirect);
      router.refresh();
    } catch {
      setError("Không kết nối được. Thử lại nhé.");
      setLoading(false);
    }
  }

  if (!selected) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800">Nhiệm Vụ &amp; Điểm</h1>
          <p className="mt-1 text-slate-500">Chọn tên của bạn</p>
        </div>
        <div className="grid w-full max-w-sm grid-cols-2 gap-4">
          {people.map((p) => (
            <button
              key={`${p.kind}-${p.id}`}
              onClick={() => choose(p)}
              className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md active:scale-95"
            >
              <span
                className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white"
                style={{ backgroundColor: p.color ?? "#64748b" }}
              >
                {p.label.charAt(0)}
              </span>
              <span className="font-semibold text-slate-700">{p.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12">
      <button
        onClick={() => setSelected(null)}
        className="self-start text-sm text-slate-500 hover:text-slate-700"
      >
        ← Quay lại
      </button>
      <div className="text-center">
        <span
          className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white"
          style={{ backgroundColor: selected.color ?? "#64748b" }}
        >
          {selected.label.charAt(0)}
        </span>
        <h2 className="text-xl font-bold text-slate-800">{selected.label}</h2>
        <p className="text-slate-500">Nhập mã PIN</p>
      </div>

      <div className="flex gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <span
            key={i}
            className={`h-4 w-4 rounded-full border-2 border-slate-400 ${
              i < pin.length ? "bg-slate-700 border-slate-700" : "bg-transparent"
            }`}
          />
        ))}
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <div className="grid w-full max-w-[260px] grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            key={d}
            disabled={loading}
            onClick={() => {
              const next = pin + d;
              pressDigit(d);
              if (next.length === 4) submit(next);
            }}
            className="rounded-xl bg-white py-4 text-lg font-semibold text-slate-700 shadow-sm border border-slate-200 active:scale-95 disabled:opacity-50"
          >
            {d}
          </button>
        ))}
        <button
          disabled={loading}
          onClick={backspace}
          className="rounded-xl bg-slate-100 py-4 text-sm font-semibold text-slate-500 active:scale-95 disabled:opacity-50"
        >
          Xóa
        </button>
        <button
          disabled={loading}
          onClick={() => {
            const next = pin + "0";
            pressDigit("0");
            if (next.length === 4) submit(next);
          }}
          className="rounded-xl bg-white py-4 text-lg font-semibold text-slate-700 shadow-sm border border-slate-200 active:scale-95 disabled:opacity-50"
        >
          0
        </button>
        <button
          disabled={loading || pin.length < 4}
          onClick={() => submit(pin)}
          className="rounded-xl bg-blue-600 py-4 text-sm font-semibold text-white active:scale-95 disabled:opacity-50"
        >
          Vào
        </button>
      </div>
    </div>
  );
}
