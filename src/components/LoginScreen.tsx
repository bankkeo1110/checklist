"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import PersonIcon from "@/components/PersonIcon";
import Corners from "@/components/Corners";

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
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-12">
        <div className="text-center">
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.1em] text-accent-700">
            Nhiệm Vụ &amp; Điểm
          </p>
          <h1 className="mt-1 text-[27px]">Chọn tên của bạn</h1>
        </div>
        <div className="grid w-full max-w-sm grid-cols-2 gap-3">
          {people.map((p) => (
            <button
              key={`${p.kind}-${p.id}`}
              onClick={() => choose(p)}
              className="blueprint flex flex-col items-center gap-3 border border-divider bg-surface px-2 py-6 hover:bg-accent-100"
            >
              <Corners />
              <span className="flex h-[48px] w-[48px] items-center justify-center border border-divider">
                <PersonIcon name={p.name} size={24} strokeWidth={1.5} />
              </span>
              <span className="font-heading text-base font-semibold">{p.label}</span>
              <span className="text-[11px] text-accent-700">{p.kind === "child" ? "Con" : "Ba / Mẹ"}</span>
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
        className="inline-flex items-center gap-1 self-start text-sm text-ink/60 hover:text-ink"
      >
        <ChevronLeft size={14} strokeWidth={1.5} />
        Quay lại
      </button>
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex h-[52px] w-[52px] items-center justify-center border border-divider">
          <PersonIcon name={selected.name} size={24} strokeWidth={1.5} />
        </span>
        <div>
          <h2 className="text-xl">{selected.label}</h2>
          <p className="text-sm text-ink/65">Nhập mã PIN</p>
        </div>
      </div>

      <div className={`flex flex-col items-center gap-2 ${error ? "animate-[shake_0.4s]" : ""}`}>
        <div className="flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i}
              className="h-[13px] w-[13px] border border-divider"
              style={{ background: i < pin.length ? "var(--color-accent-700)" : "transparent" }}
            />
          ))}
        </div>
        {error && <p className="text-[12.5px] font-semibold text-ink">{error}</p>}
      </div>

      <div className="grid w-full max-w-[260px] grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            key={d}
            disabled={loading}
            onClick={() => {
              const next = pin + d;
              pressDigit(d);
              if (next.length === 4) submit(next);
            }}
            className="blueprint border border-divider bg-surface py-4 text-lg font-semibold hover:bg-accent-100 disabled:opacity-45"
          >
            <Corners />
            {d}
          </button>
        ))}
        <button
          disabled={loading}
          onClick={backspace}
          className="blueprint border border-divider bg-surface py-4 text-xs font-semibold text-ink/60 hover:bg-accent-100 disabled:opacity-45"
        >
          <Corners />
          Xóa
        </button>
        <button
          disabled={loading}
          onClick={() => {
            const next = pin + "0";
            pressDigit("0");
            if (next.length === 4) submit(next);
          }}
          className="blueprint border border-divider bg-surface py-4 text-lg font-semibold hover:bg-accent-100 disabled:opacity-45"
        >
          <Corners />
          0
        </button>
        <button
          disabled={loading || pin.length < 4}
          onClick={() => submit(pin)}
          className="blueprint border border-accent-700 bg-accent-700 py-4 text-xs font-semibold text-canvas disabled:opacity-45"
        >
          <Corners />
          Vào
        </button>
      </div>
    </div>
  );
}
