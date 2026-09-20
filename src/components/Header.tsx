"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import PersonBadge from "@/components/PersonBadge";

export default function Header({
  name,
  caption,
  personName,
}: {
  name: string;
  caption: string;
  personName: string;
}) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2.5">
      <PersonBadge name={personName} size={44} iconSize={18} radius={14} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-[17px] font-bold">{name}</p>
        <p className="text-xs font-semibold text-muted">{caption}</p>
      </div>
      <button
        onClick={logout}
        aria-label="Đăng xuất"
        className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl bg-white text-muted shadow-md"
      >
        <LogOut size={17} strokeWidth={2} />
      </button>
    </div>
  );
}
