"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import PersonIcon from "@/components/PersonIcon";

export default function Header({
  name,
  roleLabel,
  personName,
}: {
  name: string;
  roleLabel: string;
  personName: string;
}) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 border-b border-divider bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
        <span className="flex h-9 w-9 flex-none items-center justify-center border border-divider">
          <PersonIcon name={personName} size={16} strokeWidth={1.5} />
        </span>
        <p className="flex-1 truncate font-heading text-[15px] font-semibold">
          {name} — {roleLabel}
        </p>
        <button
          onClick={logout}
          aria-label="Đăng xuất"
          className="flex h-9 w-9 flex-none items-center justify-center text-accent-700 hover:bg-accent-100"
        >
          <LogOut size={16} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}
