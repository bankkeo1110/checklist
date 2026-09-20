"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, Star, X } from "lucide-react";
import PersonBadge from "@/components/PersonBadge";
import Spinner from "@/components/Spinner";
import { personTheme } from "@/lib/personTheme";

type Person = {
  kind: "child" | "parent";
  id: string;
  name: string;
  label: string;
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
      <div className="flex flex-1 flex-col items-center justify-center gap-7 px-6 py-12">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <span
            className="mb-1 flex h-16 w-16 animate-[floatBlob_4s_ease-in-out_infinite] items-center justify-center rounded-[22px] text-white shadow-lg"
            style={{ background: "linear-gradient(145deg,#FF9F45,#FF6B6B)" }}
          >
            <Star size={32} strokeWidth={0} fill="currentColor" />
          </span>
          <h1 className="font-display text-[26px] font-extrabold">Nhiệm Vụ &amp; Điểm</h1>
          <p className="text-[15px] font-semibold text-muted">Ai đang dùng máy nè? 👋</p>
        </div>
        <div className="grid w-full max-w-sm grid-cols-2 gap-3.5">
          {people.map((p) => {
            const theme = personTheme(p.name);
            return (
              <button
                key={`${p.kind}-${p.id}`}
                onClick={() => choose(p)}
                className="flex flex-col items-center gap-2.5 rounded-3xl bg-white px-2.5 py-6 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.97]"
              >
                <PersonBadge name={p.name} size={56} iconSize={26} radius={18} />
                <span className="font-display text-[17px] font-bold">{p.label}</span>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[11.5px] font-bold"
                  style={{ background: theme.tint, color: theme.text }}
                >
                  {p.kind === "child" ? "Con" : "Ba / Mẹ"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12">
      <button
        onClick={() => setSelected(null)}
        className="inline-flex items-center gap-1.5 self-start text-sm font-bold text-muted hover:text-ink"
      >
        <ChevronLeft size={16} strokeWidth={2.2} />
        Quay lại
      </button>
      <div className="flex flex-col items-center gap-2.5 text-center">
        <PersonBadge name={selected.name} size={76} iconSize={32} radius={26} />
        <div>
          <h2 className="font-display text-xl font-bold">{selected.label}</h2>
          <p className="text-[13.5px] font-semibold text-muted">Nhập mã PIN nha</p>
        </div>
      </div>

      <div className={`flex flex-col items-center gap-3 ${error ? "animate-[shake_0.4s]" : ""}`}>
        <div className="flex gap-3.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i}
              className="h-4 w-4 rounded-full border-[2.5px]"
              style={{
                background: i < pin.length ? "var(--color-blue)" : "white",
                borderColor: i < pin.length ? "var(--color-blue)" : "#e4e1e8",
              }}
            />
          ))}
        </div>
        {loading && (
          <p className="inline-flex items-center gap-1.5 text-[13px] font-bold text-muted">
            <Spinner size={14} />
            Đang kiểm tra…
          </p>
        )}
        {error && (
          <p className="inline-flex items-center gap-1.5 rounded-full bg-[#ffecec] px-3.5 py-1.5 text-[13px] font-bold text-coral">
            <X size={14} strokeWidth={2.2} />
            {error}
          </p>
        )}
      </div>

      <div className="grid w-full max-w-[260px] grid-cols-3 gap-2.5">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            key={d}
            disabled={loading}
            onClick={() => {
              const next = pin + d;
              pressDigit(d);
              if (next.length === 4) submit(next);
            }}
            className="h-[60px] rounded-[18px] bg-white text-lg font-bold shadow-md active:scale-[0.94] disabled:opacity-50"
          >
            {d}
          </button>
        ))}
        <button
          disabled={loading}
          onClick={backspace}
          className="h-[60px] rounded-[18px] bg-divider text-xs font-bold text-muted active:scale-[0.94] disabled:opacity-50"
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
          className="h-[60px] rounded-[18px] bg-white text-lg font-bold shadow-md active:scale-[0.94] disabled:opacity-50"
        >
          0
        </button>
        <button
          disabled={loading || pin.length < 4}
          onClick={() => submit(pin)}
          className="flex h-[60px] items-center justify-center rounded-[18px] bg-blue text-xs font-bold text-white active:scale-[0.94] disabled:opacity-70"
        >
          {loading ? <Spinner size={16} /> : "Vào"}
        </button>
      </div>
    </div>
  );
}
