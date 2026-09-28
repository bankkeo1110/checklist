"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import type { ChatMessageView } from "@/lib/chat";
import PersonBadge from "@/components/PersonBadge";
import Spinner from "@/components/Spinner";
import { dayKey, formatDayLabel, formatTime } from "@/components/chat/format";

const POLL_MS = 3_000;
const MAX_LENGTH = 1000;

function mergeMessages(current: ChatMessageView[], incoming: ChatMessageView[]) {
  if (incoming.length === 0) return current;
  const seen = new Set(current.map((m) => m.id));
  const added = incoming.filter((m) => !seen.has(m.id));
  if (added.length === 0) return current;
  return [...current, ...added].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export default function ChatRoom({
  conversationId,
  isGroup,
  onRead,
}: {
  conversationId: string;
  isGroup: boolean;
  /** Called after messages are fetched (which marks them read), so unread badges can refresh. */
  onRead?: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessageView[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const lastStamp = useRef<string | undefined>(undefined);

  useEffect(() => {
    lastStamp.current = messages.at(-1)?.createdAt;
  }, [messages]);

  const poll = useCallback(async () => {
    try {
      const after = lastStamp.current ? `?after=${encodeURIComponent(lastStamp.current)}` : "";
      const res = await fetch(`/api/chat/conversations/${conversationId}/messages${after}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const incoming: ChatMessageView[] = data.messages ?? [];
      setMessages((current) => mergeMessages(current, incoming));
      setLoaded(true);
      if (incoming.length > 0) onRead?.();
    } catch {
      // Try again on the next tick.
    }
  }, [conversationId, onRead]);

  useEffect(() => {
    poll(); // also marks the conversation as read
    const timer = setInterval(poll, POLL_MS);
    return () => clearInterval(timer);
  }, [poll]);

  useEffect(() => {
    const list = listRef.current;
    if (list && stickToBottom.current) list.scrollTop = list.scrollHeight;
  }, [messages]);

  function onScroll() {
    const list = listRef.current;
    if (!list) return;
    stickToBottom.current = list.scrollHeight - list.scrollTop - list.clientHeight < 80;
  }

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Không gửi được.");
        return;
      }
      stickToBottom.current = true;
      setMessages((current) => mergeMessages(current, [data.message]));
      setDraft("");
    } catch {
      setError("Không kết nối được. Thử lại nhé.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={listRef} onScroll={onScroll} className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-3">
        {!loaded && (
          <div className="m-auto">
            <Spinner size={20} />
          </div>
        )}
        {loaded && messages.length === 0 && (
          <p className="m-auto text-center text-sm font-semibold text-muted">Chưa có tin nhắn nào. Gửi lời chào nhé! 👋</p>
        )}
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const newDay = !prev || dayKey(prev.createdAt) !== dayKey(m.createdAt);
          const firstOfRun = newDay || prev.senderName !== m.senderName || prev.mine !== m.mine;
          return (
            <div key={m.id} className="flex flex-col">
              {newDay && (
                <p className="my-2 self-center rounded-full bg-divider px-3 py-1 text-[11px] font-bold text-muted">
                  {formatDayLabel(m.createdAt)}
                </p>
              )}
              <div className={`flex items-end gap-2 ${m.mine ? "flex-row-reverse" : ""} ${firstOfRun ? "mt-1.5" : ""}`}>
                {!m.mine && (
                  <span className="w-[30px] flex-none">
                    {firstOfRun && <PersonBadge name={m.senderName} size={30} iconSize={13} radius={10} />}
                  </span>
                )}
                <div className={`flex max-w-[78%] flex-col ${m.mine ? "items-end" : "items-start"}`}>
                  {firstOfRun && !m.mine && isGroup && (
                    <span className="mb-0.5 px-1 text-[11px] font-bold text-muted">{m.senderLabel}</span>
                  )}
                  <div
                    className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[14px] font-semibold ${
                      m.mine ? "rounded-br-md bg-blue text-white" : "rounded-bl-md bg-divider text-ink"
                    }`}
                  >
                    {m.body}
                  </div>
                  <span className="mt-0.5 px-1 text-[10.5px] font-semibold text-muted">{formatTime(m.createdAt)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-end gap-2 border-t border-divider p-3"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX_LENGTH))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="Nhập tin nhắn…"
          className="max-h-32 min-h-[46px] flex-1 resize-none rounded-2xl border-2 border-divider bg-white px-3.5 py-2.5 text-[14px] font-semibold focus:border-blue focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          aria-label="Gửi"
          className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-2xl bg-blue text-white shadow-md disabled:opacity-50"
        >
          {sending ? <Spinner size={16} /> : <SendHorizontal size={19} strokeWidth={2.2} />}
        </button>
      </form>
      {error && <p className="px-3 pb-2 text-sm font-semibold text-coral-text">{error}</p>}
    </div>
  );
}
