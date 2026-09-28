"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, BellRing, ChevronLeft, MessageCircle, Volume2, VolumeX, X } from "lucide-react";
import type { InboxRow, UnreadSummary } from "@/lib/chat";
import ChatInbox from "@/components/chat/ChatInbox";
import ChatRoom from "@/components/chat/ChatRoom";
import ChatAvatar from "@/components/chat/ChatAvatar";
import { playChime } from "@/components/chat/chime";

const UNREAD_POLL_MS = 10_000;
const TOAST_MS = 6_000;
const OPEN_KEY = "chatDockOpen";
const SOUND_KEY = "chatSound";
const NOTIFIED_KEY = "chatLastNotifiedId";
// Wide enough that the panel sits in the empty margin beside the centered
// max-w-3xl content instead of covering it — start open there by default.
const DOCKED_MIN_WIDTH = 1536;

type Room = { id: string; title: string; avatarName: string | null };
type Latest = NonNullable<UnreadSummary["latest"]>;

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function store(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode etc. — just don't remember.
  }
}

function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
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
  const [toast, setToast] = useState<Latest | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");

  // Refs so the polling callback always sees current UI state without re-subscribing.
  const openRef = useRef(open);
  const roomRef = useRef(room);
  const soundRef = useRef(soundOn);
  const lastNotifiedId = useRef<string | null>(null);
  const baseTitle = useRef<string | null>(null);
  useEffect(() => {
    openRef.current = open;
    roomRef.current = room;
    soundRef.current = soundOn;
  }, [open, room, soundOn]);

  useEffect(() => {
    const storedOpen = readStored(OPEN_KEY);
    setOpen(storedOpen === null ? window.innerWidth >= DOCKED_MIN_WIDTH : storedOpen === "1");
    setSoundOn(readStored(SOUND_KEY) !== "0");
    lastNotifiedId.current = readStored(NOTIFIED_KEY);
    if (notificationsSupported()) setPermission(Notification.permission);
  }, []);

  const openRoom = useCallback((next: Room) => {
    setRoom(next);
    setOpen(true);
    store(OPEN_KEY, "1");
    setToast(null);
  }, []);

  const announce = useCallback(
    (latest: Latest) => {
      const viewingThisRoom =
        openRef.current && roomRef.current?.id === latest.conversationId && document.visibilityState === "visible";
      if (viewingThisRoom) return;

      if (soundRef.current) playChime();
      if (!(openRef.current && document.visibilityState === "visible")) setToast(latest);

      if (document.visibilityState !== "visible" && notificationsSupported() && Notification.permission === "granted") {
        try {
          const notification = new Notification(latest.title, {
            body: latest.title === latest.senderLabel ? latest.body : `${latest.senderLabel}: ${latest.body}`,
            tag: `chat-${latest.conversationId}`,
            icon: "/favicon.ico",
          });
          notification.onclick = () => {
            window.focus();
            openRoom({ id: latest.conversationId, title: latest.title, avatarName: latest.avatarName });
            notification.close();
          };
        } catch {
          // Some mobile browsers only allow notifications from a service worker.
        }
      }
    },
    [openRoom],
  );

  const refreshUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/unread", { cache: "no-store" });
      if (!res.ok) return;
      const data: UnreadSummary = await res.json();
      setUnread(data.unread ?? 0);
      const latest = data.latest;
      if (latest && latest.id !== lastNotifiedId.current) {
        // Only announce messages that arrived recently, so opening the app after
        // a day away doesn't chime for yesterday's message.
        const fresh = Date.now() - new Date(latest.createdAt).getTime() < 5 * 60_000;
        lastNotifiedId.current = latest.id;
        store(NOTIFIED_KEY, latest.id);
        if (fresh) announce(latest);
      }
    } catch {
      // Offline — keep the last count.
    }
  }, [announce]);

  useEffect(() => {
    refreshUnread();
    const timer = setInterval(refreshUnread, UNREAD_POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && refreshUnread();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshUnread]);

  // "(2) Page title" while there are unread messages.
  useEffect(() => {
    if (baseTitle.current === null) baseTitle.current = document.title.replace(/^\(\d+\+?\) /, "");
    document.title = unread > 0 ? `(${unread > 99 ? "99+" : unread}) ${baseTitle.current}` : baseTitle.current;
  }, [unread]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  function toggle(next: boolean) {
    setOpen(next);
    store(OPEN_KEY, next ? "1" : "0");
    if (next) setToast(null);
  }

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    store(SOUND_KEY, next ? "1" : "0");
    if (next) playChime();
  }

  async function enableNotifications() {
    if (!notificationsSupported()) return;
    try {
      setPermission(await Notification.requestPermission());
    } catch {
      // Older Safari uses a callback form; ignore.
    }
  }

  function backToInbox() {
    setRoom(null);
    refreshUnread();
  }

  const toastView = toast && (
    <button
      onClick={() => openRoom({ id: toast.conversationId, title: toast.title, avatarName: toast.avatarName })}
      className="fixed z-50 flex w-[300px] max-w-[calc(100vw-32px)] cursor-pointer items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-2xl ring-1 ring-divider
        max-md:bottom-[calc(env(safe-area-inset-bottom,0px)+88px)] max-md:right-4
        md:right-16 md:top-1/2 md:-translate-y-1/2"
    >
      <ChatAvatar avatarName={toast.avatarName} size={38} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-[14px] font-bold">{toast.title}</p>
        <p className="line-clamp-2 text-[12.5px] font-semibold text-muted">
          {toast.title === toast.senderLabel ? toast.body : `${toast.senderLabel}: ${toast.body}`}
        </p>
      </div>
    </button>
  );

  if (!open) {
    return (
      <>
        <button
          onClick={() => toggle(true)}
          aria-label={unread > 0 ? `Mở tin nhắn (${unread} chưa đọc)` : "Mở tin nhắn"}
          className={`fixed z-40 flex cursor-pointer items-center justify-center bg-blue text-white shadow-lg transition hover:bg-blue-text
            max-md:bottom-[calc(env(safe-area-inset-bottom,0px)+20px)] max-md:right-4 max-md:h-14 max-md:w-14 max-md:rounded-full
            md:right-0 md:top-1/2 md:-translate-y-1/2 md:flex-col md:gap-2 md:rounded-l-2xl md:px-2.5 md:py-4
            ${unread > 0 ? "chat-attention" : ""}`}
        >
          <MessageCircle size={22} strokeWidth={2.2} />
          <span className="hidden font-display text-[13px] font-bold [writing-mode:vertical-rl] md:block">Tin nhắn</span>
          <Badge count={unread} className="absolute -left-1.5 -top-1.5" />
        </button>
        {toastView}
      </>
    );
  }

  const iconButton =
    "flex h-[34px] w-[34px] flex-none cursor-pointer items-center justify-center rounded-xl text-muted hover:bg-divider";

  return (
    <>
      {/* Tap-outside backdrop on phones, where the panel covers the page. */}
      <div className="fixed inset-0 z-40 bg-ink/20 md:hidden" onClick={() => toggle(false)} />
      <aside
        className="fixed z-50 flex flex-col overflow-hidden bg-white shadow-2xl
          max-md:inset-x-0 max-md:bottom-0 max-md:top-[calc(env(safe-area-inset-top,0px)+48px)] max-md:rounded-t-[24px]
          md:bottom-4 md:right-4 md:top-4 md:w-[380px] md:rounded-[24px]"
      >
        <div className="flex items-center gap-1.5 border-b border-divider px-3 py-3">
          {room ? (
            <>
              <button onClick={backToInbox} aria-label="Quay lại danh sách" className={iconButton}>
                <ChevronLeft size={19} />
              </button>
              <ChatAvatar avatarName={room.avatarName} size={34} />
              <p className="ml-1 min-w-0 flex-1 truncate font-display text-[16px] font-bold">{room.title}</p>
            </>
          ) : (
            <>
              <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-xl bg-blue-tint text-blue-text">
                <MessageCircle size={18} strokeWidth={2.2} />
              </span>
              <p className="ml-1 min-w-0 flex-1 font-display text-[16px] font-bold">Tin nhắn</p>
              <Badge count={unread} />
            </>
          )}
          <button
            onClick={toggleSound}
            aria-label={soundOn ? "Tắt âm báo" : "Bật âm báo"}
            title={soundOn ? "Tắt âm báo" : "Bật âm báo"}
            className={iconButton}
          >
            {soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
          <button onClick={() => toggle(false)} aria-label="Thu gọn tin nhắn" className={iconButton}>
            <X size={18} />
          </button>
        </div>
        {!room && permission === "default" && (
          <button
            onClick={enableNotifications}
            className="flex cursor-pointer items-center gap-2.5 bg-yellow/20 px-4 py-2.5 text-left text-[12.5px] font-bold text-ink hover:bg-yellow/30"
          >
            <BellRing size={16} className="flex-none text-orange" />
            <span className="flex-1">Bật thông báo để biết khi có tin nhắn mới, kể cả khi đang ở tab khác.</span>
          </button>
        )}
        {!room && permission === "denied" && (
          <p className="flex items-center gap-2.5 bg-divider px-4 py-2 text-[12px] font-semibold text-muted">
            <Bell size={15} className="flex-none" />
            Thông báo đang bị chặn — bật lại trong cài đặt trình duyệt cho trang này.
          </p>
        )}
        {room ? (
          <ChatRoom key={room.id} conversationId={room.id} isGroup={room.avatarName === null} onRead={refreshUnread} />
        ) : (
          <ChatInbox
            onOpen={(row: InboxRow, conversationId: string) =>
              openRoom({ id: conversationId, title: row.title, avatarName: row.avatarName })
            }
          />
        )}
      </aside>
    </>
  );
}
