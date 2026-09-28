"use client";

import { useEffect, useState } from "react";
import type { InboxRow } from "@/lib/chat";
import Spinner from "@/components/Spinner";
import ChatAvatar from "@/components/chat/ChatAvatar";
import { formatInboxStamp } from "@/components/chat/format";

const POLL_MS = 10_000;

export default function ChatInbox({ onOpen }: { onOpen: (row: InboxRow, conversationId: string) => void }) {
  const [rows, setRows] = useState<InboxRow[] | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/chat/conversations", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "Không tải được tin nhắn.");
          setRows((current) => current ?? []);
          return;
        }
        setError(null);
        setRows(data.rows);
      } catch {
        if (!cancelled) setRows((current) => current ?? []);
      }
    }
    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  async function open(row: InboxRow) {
    if (row.conversationId) {
      onOpen(row, row.conversationId);
      return;
    }
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
        return;
      }
      onOpen(row, data.id);
    } catch {
      setError("Không kết nối được. Thử lại nhé.");
    } finally {
      setOpening(null);
    }
  }

  if (rows === null) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner size={20} />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {error && <p className="px-4 py-2 text-sm font-semibold text-coral-text">{error}</p>}
      <div className="flex flex-col divide-y divide-divider">
        {rows.map((row) => (
          <button
            key={row.key}
            disabled={opening !== null}
            onClick={() => open(row)}
            className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left hover:bg-divider/60"
          >
            <ChatAvatar avatarName={row.avatarName} size={40} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <p className={`min-w-0 flex-1 truncate font-display text-[14.5px] ${row.unread ? "font-extrabold" : "font-bold"}`}>
                  {row.title}
                </p>
                {row.lastMessage && (
                  <span className="flex-none text-[11px] font-semibold text-muted">
                    {formatInboxStamp(row.lastMessage.createdAt)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <p className={`min-w-0 flex-1 truncate text-[12.5px] ${row.unread ? "font-bold text-ink" : "font-semibold text-muted"}`}>
                  {row.lastMessage
                    ? `${row.lastMessage.mine ? "Bạn" : row.lastMessage.senderLabel}: ${row.lastMessage.body}`
                    : "Chưa có tin nhắn — bấm để nhắn"}
                </p>
                {row.unread > 0 && (
                  <span className="flex h-[19px] min-w-[19px] flex-none items-center justify-center rounded-full bg-coral px-1.5 text-[11px] font-extrabold text-white">
                    {row.unread > 99 ? "99+" : row.unread}
                  </span>
                )}
                {opening === row.key && <Spinner size={14} />}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
