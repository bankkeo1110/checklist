"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AtSign, Reply, SendHorizontal, Smile, X } from "lucide-react";
import type { ChatMessageView, ChatPerson } from "@/lib/chat";
import { EVERYONE_KEY, EVERYONE_LABEL, mentionHandle, mentionKey, splitMentions } from "@/lib/mentions";
import PersonBadge from "@/components/PersonBadge";
import Spinner from "@/components/Spinner";
import { dayKey, formatDayLabel, formatTime } from "@/components/chat/format";
import StickerImage from "@/components/chat/StickerImage";
import { STICKERS } from "@/lib/stickers";

const POLL_MS = 3_000;
const MAX_LENGTH = 1000;

function mergeMessages(current: ChatMessageView[], incoming: ChatMessageView[]) {
  if (incoming.length === 0) return current;
  const seen = new Set(current.map((m) => m.id));
  const added = incoming.filter((m) => !seen.has(m.id));
  if (added.length === 0) return current;
  return [...current, ...added].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** "@" plus whatever's typed since it, as long as the "@" starts a word and nothing after it breaks the word. */
function detectMention(value: string, caret: number): { start: number; query: string } | null {
  const uptoCaret = value.slice(0, caret);
  const at = uptoCaret.lastIndexOf("@");
  if (at === -1) return null;
  const query = uptoCaret.slice(at + 1);
  if (/\s/.test(query)) return null;
  const before = at === 0 ? " " : value[at - 1];
  if (!/\s/.test(before)) return null;
  return { start: at, query };
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
  const [members, setMembers] = useState<ChatPerson[]>([]);
  const [me, setMe] = useState<{ kind: ChatPerson["kind"]; id: string } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessageView | null>(null);
  const [mention, setMention] = useState<{ start: number; query: string } | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const lastStamp = useRef<string | undefined>(undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messageRefs = useRef(new Map<string, HTMLDivElement>());

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
      if (Array.isArray(data.members)) setMembers(data.members);
      if (data.me) setMe(data.me);
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

  const membersByKey = useMemo(() => new Map(members.map((p) => [mentionKey(p), p])), [members]);
  const mentionTargets = useMemo(() => {
    const others = members.filter((p) => !(me && p.kind === me.kind && p.id === me.id));
    return [
      { key: EVERYONE_KEY, handle: EVERYONE_LABEL },
      ...others.map((p) => ({ key: mentionKey(p), handle: mentionHandle(p.label) })),
    ];
  }, [members, me]);
  const filteredMentions = useMemo(() => {
    if (!mention) return [];
    const q = mention.query.toLowerCase();
    return mentionTargets.filter((t) => t.handle.toLowerCase().includes(q));
  }, [mention, mentionTargets]);

  function onDraftChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value.slice(0, MAX_LENGTH);
    setDraft(value);
    setMention(detectMention(value, e.target.selectionStart ?? value.length));
    setMentionIndex(0);
  }

  function selectMention(target: { key: string; handle: string }) {
    if (!mention) return;
    const before = draft.slice(0, mention.start);
    const after = draft.slice(mention.start + 1 + mention.query.length);
    const inserted = `@${target.handle} `;
    const next = `${before}${inserted}${after}`.slice(0, MAX_LENGTH);
    setDraft(next);
    setMention(null);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      const pos = Math.min(before.length + inserted.length, next.length);
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }

  function insertAtSign() {
    const el = textareaRef.current;
    const caret = el?.selectionStart ?? draft.length;
    const before = draft.slice(0, caret);
    const needsSpace = before.length > 0 && !/\s$/.test(before);
    const insertion = `${needsSpace ? " " : ""}@`;
    const next = `${before}${insertion}${draft.slice(caret)}`.slice(0, MAX_LENGTH);
    setDraft(next);
    setMention({ start: before.length + insertion.length - 1, query: "" });
    setMentionIndex(0);
    requestAnimationFrame(() => {
      const pos = before.length + insertion.length;
      el?.focus();
      el?.setSelectionRange(pos, pos);
    });
  }

  function scrollToMessage(id: string) {
    const el = messageRefs.current.get(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightId(id);
    setTimeout(() => setHighlightId((current) => (current === id ? null : current)), 1200);
  }

  async function post(payload: { body: string } | { stickerId: string }) {
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, replyToId: replyingTo?.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Không gửi được.");
        return;
      }
      stickToBottom.current = true;
      setMessages((current) => mergeMessages(current, [data.message]));
      if ("body" in payload) setDraft("");
      else setShowStickers(false);
      setReplyingTo(null);
      setMention(null);
    } catch {
      setError("Không kết nối được. Thử lại nhé.");
    } finally {
      setSending(false);
    }
  }

  function send() {
    const text = draft.trim();
    if (!text || sending) return;
    post({ body: text });
  }

  function sendSticker(stickerId: string) {
    if (sending) return;
    post({ stickerId });
  }

  function onTextareaKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mention && filteredMentions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((i) => (i + 1) % filteredMentions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((i) => (i - 1 + filteredMentions.length) % filteredMentions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        selectMention(filteredMentions[Math.min(mentionIndex, filteredMentions.length - 1)]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMention(null);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
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
            <div
              key={m.id}
              ref={(el) => {
                if (el) messageRefs.current.set(m.id, el);
                else messageRefs.current.delete(m.id);
              }}
              className={`flex flex-col rounded-xl transition-colors duration-500 ${highlightId === m.id ? "bg-yellow/25" : ""}`}
            >
              {newDay && (
                <p className="my-2 self-center rounded-full bg-divider px-3 py-1 text-[11px] font-bold text-muted">
                  {formatDayLabel(m.createdAt)}
                </p>
              )}
              <div className={`group flex items-end gap-1 ${m.mine ? "flex-row-reverse" : ""} ${firstOfRun ? "mt-1.5" : ""}`}>
                {!m.mine && (
                  <span className="w-[30px] flex-none">
                    {firstOfRun && <PersonBadge name={m.senderName} size={30} iconSize={13} radius={10} />}
                  </span>
                )}
                <div className={`flex max-w-[78%] flex-col ${m.mine ? "items-end" : "items-start"}`}>
                  {firstOfRun && !m.mine && isGroup && (
                    <span className="mb-0.5 px-1 text-[11px] font-bold text-muted">{m.senderLabel}</span>
                  )}
                  {m.replyTo && (
                    <button
                      type="button"
                      onClick={() => scrollToMessage(m.replyTo!.id)}
                      className="mb-1 flex max-w-full flex-col rounded-xl border-l-[3px] border-blue/60 bg-divider/70 px-2.5 py-1.5 text-left"
                    >
                      <span className="text-[11px] font-bold text-blue-text">{m.replyTo.senderLabel}</span>
                      <span className="truncate text-[12px] font-semibold text-muted">{m.replyTo.body}</span>
                    </button>
                  )}
                  {m.stickerId ? (
                    <StickerImage id={m.stickerId} size={96} />
                  ) : (
                    <div
                      className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[14px] font-semibold ${
                        m.mine ? "rounded-br-md bg-blue text-white" : "rounded-bl-md bg-divider text-ink"
                      }`}
                    >
                      {splitMentions(m.body, members).map((seg, idx) =>
                        seg.mention ? (
                          <span
                            key={idx}
                            className={`font-extrabold ${m.mine ? "text-white underline decoration-white/50" : "text-blue-text"}`}
                          >
                            {seg.text}
                          </span>
                        ) : (
                          <span key={idx}>{seg.text}</span>
                        ),
                      )}
                    </div>
                  )}
                  <span className="mt-0.5 px-1 text-[10.5px] font-semibold text-muted">{formatTime(m.createdAt)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(m)}
                  aria-label="Trả lời"
                  className="flex h-7 w-7 flex-none items-center justify-center self-center rounded-full text-muted/50 opacity-0 transition hover:bg-divider hover:text-muted group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <Reply size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showStickers && (
        <div className="max-h-[220px] overflow-y-auto border-t border-divider p-2">
          <div className="grid grid-cols-6 gap-1">
            {STICKERS.map((sticker) => (
              <button
                key={sticker.id}
                type="button"
                disabled={sending}
                onClick={() => sendSticker(sticker.id)}
                aria-label={`Gửi sticker ${sticker.emoji}`}
                className="flex aspect-square cursor-pointer items-center justify-center rounded-xl hover:bg-divider disabled:opacity-50"
              >
                <StickerImage id={sticker.id} size={40} animated={false} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        {mention && filteredMentions.length > 0 && (
          <div className="absolute inset-x-3 bottom-full z-10 mb-1 max-h-48 overflow-y-auto rounded-2xl border border-divider bg-white p-1.5 shadow-lg">
            {filteredMentions.map((t, idx) => {
              const person = membersByKey.get(t.key);
              return (
                <button
                  key={t.key}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectMention(t)}
                  className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-[13px] font-bold ${
                    idx === mentionIndex ? "bg-blue-tint text-blue-text" : "text-ink hover:bg-divider"
                  }`}
                >
                  {person ? (
                    <PersonBadge name={person.name} size={22} iconSize={11} radius={7} />
                  ) : (
                    <span className="flex h-[22px] w-[22px] flex-none items-center justify-center" aria-hidden>
                      📣
                    </span>
                  )}
                  @{t.handle}
                </button>
              );
            })}
          </div>
        )}

        {replyingTo && (
          <div className="flex items-center gap-2 border-t border-divider bg-divider/50 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-blue-text">Trả lời {replyingTo.senderLabel}</p>
              <p className="truncate text-[12.5px] font-semibold text-muted">{replyingTo.body}</p>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              aria-label="Hủy trả lời"
              className="flex-none p-1 text-muted hover:text-ink"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-end gap-2 border-t border-divider p-3"
        >
          <button
            type="button"
            onClick={insertAtSign}
            aria-label="Gắn thẻ ai đó"
            className="flex h-[46px] w-[36px] flex-none cursor-pointer items-center justify-center rounded-2xl text-muted hover:bg-divider"
          >
            <AtSign size={20} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => setShowStickers((v) => !v)}
            aria-label={showStickers ? "Đóng sticker" : "Chọn sticker"}
            aria-pressed={showStickers}
            className={`flex h-[46px] w-[36px] flex-none cursor-pointer items-center justify-center rounded-2xl ${
              showStickers ? "bg-yellow/30 text-orange" : "text-muted hover:bg-divider"
            }`}
          >
            {showStickers ? <X size={20} /> : <Smile size={22} strokeWidth={2} />}
          </button>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={onDraftChange}
            onKeyDown={onTextareaKeyDown}
            onBlur={() => setTimeout(() => setMention(null), 100)}
            rows={1}
            placeholder="Nhập tin nhắn… (@ để gắn thẻ)"
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
      </div>
      {error && <p className="px-3 pb-2 text-sm font-semibold text-coral-text">{error}</p>}
    </div>
  );
}
