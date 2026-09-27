"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import Spinner from "@/components/Spinner";

export default function ChangePinForm() {
  const [open, setOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function reset() {
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setError(null);
  }

  async function submit() {
    setError(null);
    setSuccess(false);
    if (!/^\d{4,6}$/.test(newPin)) {
      setError("Mã PIN mới phải có 4-6 chữ số.");
      return;
    }
    if (newPin !== confirmPin) {
      setError("Mã PIN mới nhập lại không khớp.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPin, newPin }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Không đổi được mã PIN.");
        return;
      }
      reset();
      setSuccess(true);
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 self-start rounded-2xl bg-white px-4 py-2.5 text-[13px] font-bold text-muted shadow-md"
      >
        <KeyRound size={15} strokeWidth={2} />
        Đổi mã PIN
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-[20px] bg-white p-4 shadow-md">
      <p className="font-display text-[15px] font-bold">🔐 Đổi mã PIN</p>
      <input
        value={currentPin}
        onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
        type="password"
        inputMode="numeric"
        placeholder="Mã PIN hiện tại"
        className="rounded-xl border-2 border-divider px-3.5 py-2.5 text-sm font-semibold focus:border-blue focus:outline-none"
      />
      <input
        value={newPin}
        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
        type="password"
        inputMode="numeric"
        placeholder="Mã PIN mới (4-6 số)"
        className="rounded-xl border-2 border-divider px-3.5 py-2.5 text-sm font-semibold focus:border-blue focus:outline-none"
      />
      <input
        value={confirmPin}
        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
        type="password"
        inputMode="numeric"
        placeholder="Nhập lại mã PIN mới"
        className="rounded-xl border-2 border-divider px-3.5 py-2.5 text-sm font-semibold focus:border-blue focus:outline-none"
      />
      {error && <p className="text-sm font-semibold text-coral-text">{error}</p>}
      {success && <p className="text-sm font-semibold text-green-text">Đã đổi mã PIN! Lần sau nhớ dùng mã mới nhé.</p>}
      <div className="flex gap-2">
        <button
          disabled={saving}
          onClick={submit}
          className="flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-[13.5px] font-extrabold text-white disabled:opacity-70"
          style={{ background: "linear-gradient(135deg,#4D96FF,#6BA8FF)" }}
        >
          {saving && <Spinner size={14} />}
          Lưu
        </button>
        <button
          disabled={saving}
          onClick={() => {
            reset();
            setSuccess(false);
            setOpen(false);
          }}
          className="rounded-2xl bg-divider px-4 py-2.5 text-[13.5px] font-extrabold text-muted disabled:opacity-50"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
