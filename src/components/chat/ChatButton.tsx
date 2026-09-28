"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

const POLL_MS = 20_000;

export default function ChatButton() {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/chat/unread", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setUnread(data.unread ?? 0);
      } catch {
        // Offline or chat unavailable — just hide the badge.
      }
    }
    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [pathname]);

  return (
    <Link
      href="/chat"
      aria-label={unread > 0 ? `Tin nhắn (${unread} chưa đọc)` : "Tin nhắn"}
      className="relative flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl bg-white text-blue-text shadow-md"
    >
      <MessageCircle size={18} strokeWidth={2} />
      {unread > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-[19px] min-w-[19px] items-center justify-center rounded-full bg-coral px-1 text-[11px] font-extrabold text-white">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
