"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, MessageCircle, X } from "lucide-react";
import type { InboxRow } from "@/lib/chat";
import ChatInbox from "@/components/chat/ChatInbox";
import ChatRoom from "@/components/chat/ChatRoom";
import ChatAvatar from "@/components/chat/ChatAvatar";

const UNREAD_POLL_MS = 15_000;
const STORAGE_KEY = "chatDockOpen";
// Wide enough that the panel sits in the empty margin beside the centered
// max-w-3xl content instead of covering it — start open there by default.
const DOCKED_MIN_WIDTH = 1536;

type Room = { id: string; title: string; avatarName: string | null };

function readStoredOpen(): boolean | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === null ? null : value === "1";
  } catch {
    return null;
  }
}

function storeOpen(open: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, open ? "1" : "0");
  } catch {
    // Private mode etc. — just don't remember.
  }
}

function Badge({ count, className = "" }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={`flex h-[19px] min-w-[19px] items-center justify-center rounded-full bg-coral px-1 text-[11px] font-extrabold text-white ring-2 ring-white ${className}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function ChatDock() {
  const [open, setOpen] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const stored = readStoredOpen();
    setOpen(stored ?? window.innerWidth >= DOCKED_MIN_WIDTH);
  }, []);

  const refreshUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/unread", { cache: "no-store" });
      if (res.ok) setUnread((await res.json()).unread ?? 0);
    } catch {
      // Offline — keep the last count.
    }
  }, []);

  useEffect(() => {
    refreshUnread();
    const timer = setInterval(refreshUnread, UNREAD_POLL_MS);
    return () => clearInterval(timer);
  }, [refreshUnread]);

  function toggle(next: boolean) {
    setOpen(next);
    storeOpen(next);
  }

  function openRoom(row: InboxRow, conversationId: string) {
    setRoom({ id: conversationId, title: row.title, avatarName: row.avatarName });
  }

  function backToInbox() {
    setRoom(null);
    refreshUnread();
  }

  if (!open) {
    return (
      <button
        onClick={() => toggle(true)}
        aria-label={unread > 0 ? `Mở tin nhắn (${unread} chưa đọc)` : "Mở tin nhắn"}
        className="fixed z-40 flex cursor-pointer items-center justify-center bg-blue text-white shadow-lg transition hover:bg-blue-text
          max-md:bottom-[calc(env(safe-area-inset-bottom,0px)+20px)] max-md:right-4 max-md:h-14 max-md:w-14 max-md:rounded-full
          md:right-0 md:top-1/2 md:-translate-y-1/2 md:flex-col md:gap-2 md:rounded-l-2xl md:px-2.5 md:py-4"
      >
        <MessageCircle size={22} strokeWidth={2.2} />
        <span className="hidden font-display text-[13px] font-bold [writing-mode:vertical-rl] md:block">Tin nhắn</span>
        <Badge count={unread} className="absolute -left-1.5 -top-1.5" />
      </button>
    );
  }

  return (
    <>
      {/* Tap-outside backdrop on phones, where the panel covers the page. */}
      <div className="fixed inset-0 z-40 bg-ink/20 md:hidden" onClick={() => toggle(false)} />
      <aside
        className="fixed z-50 flex flex-col overflow-hidden bg-white shadow-2xl
          max-md:inset-x-0 max-md:bottom-0 max-md:top-[calc(env(safe-area-inset-top,0px)+48px)] max-md:rounded-t-[24px]
          md:bottom-4 md:right-4 md:top-4 md:w-[380px] md:rounded-[24px]"
      >
        <div className="flex items-center gap-2.5 border-b border-divider px-3 py-3">
          {room ? (
            <>
              <button
                onClick={backToInbox}
                aria-label="Quay lại danh sách"
                className="flex h-[34px] w-[34px] flex-none cursor-pointer items-center justify-center rounded-xl text-muted hover:bg-divider"
              >
                <ChevronLeft size={19} />
              </button>
              <ChatAvatar avatarName={room.avatarName} size={34} />
              <p className="min-w-0 flex-1 truncate font-display text-[16px] font-bold">{room.title}</p>
            </>
          ) : (
            <>
              <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-xl bg-blue-tint text-blue-text">
                <MessageCircle size={18} strokeWidth={2.2} />
              </span>
              <p className="min-w-0 flex-1 font-display text-[16px] font-bold">Tin nhắn</p>
              <Badge count={unread} />
            </>
          )}
          <button
            onClick={() => toggle(false)}
            aria-label="Thu gọn tin nhắn"
            className="flex h-[34px] w-[34px] flex-none cursor-pointer items-center justify-center rounded-xl text-muted hover:bg-divider"
          >
            <X size={18} />
          </button>
        </div>
        {room ? (
          <ChatRoom key={room.id} conversationId={room.id} isGroup={room.avatarName === null} onRead={refreshUnread} />
        ) : (
          <ChatInbox onOpen={openRoom} />
        )}
      </aside>
    </>
  );
}
