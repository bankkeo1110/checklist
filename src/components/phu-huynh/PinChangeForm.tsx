"use client";

import { useState } from "react";
import Spinner from "@/components/Spinner";

type Props = {
  kind: "child" | "parent";
  id: string;
  title: string;
  requireCurrent?: boolean;
  defaultPin?: string;
};

const inputClass =
  "w-full rounded-xl border-2 border-divider px-3 py-2 text-[13.5px] font-semibold tracking-widest focus:border-blue focus:outline-none";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}

export default function PinChangeForm({ kind, id, title, requireCurrent = false, defaultPin }: Props) {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function resetToDefault() {
    setSuccess(null);
    setError(null);
    setResetting(true);
    try {
      const res = await fetch("/api/auth/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, id, reset: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Không thực hiện được.");
        return;
      }
      setNewPin("");
      setConfirmPin("");
      setSuccess(`✅ Đã reset mã PIN về ${defaultPin}.`);
    } catch {
      setError("Không kết nối được. Thử lại nhé.");
    } finally {
      setResetting(false);
      setConfirmingReset(false);
    }
  }

  async function submit() {
    setSuccess(null);
    setConfirmingReset(false);
    if (requireCurrent && currentPin.length < 4) {
      setError("Nhập mã PIN hiện tại.");
      return;
    }
    if (!/^\d{4,6}$/.test(newPin)) {
      setError("Mã PIN mới phải gồm 4–6 chữ số.");
      return;
    }
    if (newPin !== confirmPin) {
      setError("Mã PIN nhập lại không khớp.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, id, currentPin: requireCurrent ? currentPin : undefined, newPin }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Không thực hiện được.");
        return;
      }
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      setSuccess("✅ Đã đổi mã PIN.");
    } catch {
      setError("Không kết nối được. Thử lại nhé.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-2.5 rounded-[20px] bg-white p-4 shadow-md"
    >
      <p className="text-[11.5px] font-bold uppercase tracking-wide text-muted">{title}</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {requireCurrent && (
          <input
            value={currentPin}
            onChange={(e) => setCurrentPin(digitsOnly(e.target.value))}
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            placeholder="PIN hiện tại"
            className={inputClass}
          />
        )}
        <input
          value={newPin}
          onChange={(e) => setNewPin(digitsOnly(e.target.value))}
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          placeholder="PIN mới (4–6 số)"
          className={inputClass}
        />
        <input
          value={confirmPin}
          onChange={(e) => setConfirmPin(digitsOnly(e.target.value))}
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          placeholder="Nhập lại PIN mới"
          className={inputClass}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={saving || resetting}
          className="flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-[13.5px] font-extrabold text-white disabled:opacity-70"
          style={{ background: "linear-gradient(135deg,#B983FF,#9C6BE0)" }}
        >
          {saving && <Spinner size={14} />}
          Đổi mã PIN
        </button>
        {defaultPin &&
          (confirmingReset ? (
            <>
              <button
                type="button"
                disabled={resetting}
                onClick={resetToDefault}
                className="flex items-center gap-1.5 rounded-2xl border-2 border-coral-text px-4 py-2 text-[13.5px] font-extrabold text-coral-text disabled:opacity-70"
              >
                {resetting && <Spinner size={14} />}
                Xác nhận reset về {defaultPin}
              </button>
              <button
                type="button"
                disabled={resetting}
                onClick={() => setConfirmingReset(false)}
                className="rounded-2xl px-3 py-2 text-[13.5px] font-bold text-muted hover:bg-divider"
              >
                Hủy
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setConfirmingReset(true);
                setError(null);
                setSuccess(null);
              }}
              className="rounded-2xl border-2 border-divider px-4 py-2 text-[13.5px] font-extrabold text-muted hover:bg-divider disabled:opacity-70"
            >
              Reset về mặc định ({defaultPin})
            </button>
          ))}
      </div>
      {error && <p className="text-sm font-semibold text-coral-text">{error}</p>}
      {success && <p className="text-sm font-semibold text-muted">{success}</p>}
    </form>
  );
}
