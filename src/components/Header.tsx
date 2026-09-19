"use client";

import { useRouter } from "next/navigation";

export default function Header({
  label,
  sublabel,
  nav,
}: {
  label: string;
  sublabel: string;
  nav?: React.ReactNode;
}) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{sublabel}</p>
          <p className="text-lg font-bold text-slate-800">{label}</p>
        </div>
        <div className="flex items-center gap-3">
          {nav}
          <button
            onClick={logout}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-50"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
}
