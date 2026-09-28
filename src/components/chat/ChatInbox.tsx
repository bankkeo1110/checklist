"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { InboxRow } from "@/lib/chat";
import Spinner from "@/components/Spinner";
import ChatAvatar from "@/components/chat/ChatAvatar";
import { formatInboxStamp } from "@/components/chat/format";

const POLL_MS = 10_000;

export default function ChatInbox({ initialRows }: { initialRows: InboxRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [opening, setOpening] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await fetch("/api/chat/conversations", { cache: "no-store" });
        if (res.ok) setRows((await res.json()).rows);
      } catch {
        // Keep showing the last list.
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, []);

  async function startDirect(row: InboxRow) {
    if (!row.target) return;
    setOpening(row.key);
    setError(null);
    try {
      const res = await fetch("/api/chat/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row.target),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Không mở được cuộc trò chuyện.");
        setOpening(null);
        return;
      }
      router.push(`/chat/${data.id}`);
    } catch {
      setError("Không kết nối được. Thử lại nhé.");
      setOpening(null);
    }
  }

  function content(row: InboxRow) {
    return (
      <>
        <ChatAvatar avatarName={row.avatarName} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <p className={`min-w-0 flex-1 truncate font-display text-[15px] ${row.unread ? "font-extrabold" : "font-bold"}`}>
              {row.title}
            </p>
            {row.lastMessage && (
              <span className="flex-none text-[11.5px] font-semibold text-muted">
                {formatInboxStamp(row.lastMessage.createdAt)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <p className={`min-w-0 flex-1 truncate text-[13px] ${row.unread ? "font-bold text-ink" : "font-semibold text-muted"}`}>
              {row.lastMessage
                ? `${row.lastMessage.mine ? "Bạn" : row.lastMessage.senderLabel}: ${row.lastMessage.body}`
                : "Chưa có tin nhắn — bấm để nhắn"}
            </p>
            {row.unread > 0 && (
              <span className="flex h-[20px] min-w-[20px] flex-none items-center justify-center rounded-full bg-coral px-1.5 text-[11px] font-extrabold text-white">
                {row.unread > 99 ? "99+" : row.unread}
              </span>
            )}
            {opening === row.key && <Spinner size={14} />}
          </div>
        </div>
      </>
    );
  }

  const rowClass = "flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-divider/60";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col divide-y divide-divider overflow-hidden rounded-[20px] bg-white shadow-md">
        {rows.map((row) =>
          row.conversationId ? (
            <Link key={row.key} href={`/chat/${row.conversationId}`} className={rowClass}>
              {content(row)}
            </Link>
          ) : (
            <button key={row.key} disabled={opening !== null} onClick={() => startDirect(row)} className={`${rowClass} cursor-pointer`}>
              {content(row)}
            </button>
          ),
        )}
      </div>
      {error && <p className="text-sm font-semibold text-coral-text">{error}</p>}
    </div>
  );
}
