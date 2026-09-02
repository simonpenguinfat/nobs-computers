"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/types";

interface ChatBoxProps {
  buildRequestId: string;
  userId: string;
  userName: string;
}

function truncate(text: string, max = 80): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

function enrichMessages(
  raw: Message[],
  nameMap: Map<string, string>
): Message[] {
  const byId = new Map(raw.map((m) => [m.id, m]));

  return raw.map((m) => {
    const parent = m.reply_to_id ? byId.get(m.reply_to_id) : undefined;
    return {
      ...m,
      sender_name: nameMap.get(m.sender_id) ?? "User",
      reply_to: parent
        ? {
            id: parent.id,
            content: parent.content,
            sender_name: nameMap.get(parent.sender_id) ?? "User",
          }
        : null,
    };
  });
}

async function resolveReplyPreview(
  supabase: ReturnType<typeof createClient>,
  replyToId: string,
  existing: Message[]
): Promise<Message["reply_to"]> {
  const parent = existing.find((m) => m.id === replyToId);
  if (parent) {
    return {
      id: parent.id,
      content: parent.content,
      sender_name: parent.sender_name,
    };
  }

  const { data: parentMsg } = await supabase
    .from("messages")
    .select("content, sender_id")
    .eq("id", replyToId)
    .single();

  if (!parentMsg) return null;

  const { data: parentProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", parentMsg.sender_id)
    .single();

  return {
    id: replyToId,
    content: parentMsg.content,
    sender_name: parentProfile?.full_name ?? "User",
  };
}

export default function ChatBox({ buildRequestId, userId }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function loadMessages() {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("build_request_id", buildRequestId)
        .order("created_at", { ascending: true });

      if (data) {
        const senderIds = [...new Set(data.map((m) => m.sender_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", senderIds);

        const nameMap = new Map(
          (profiles ?? []).map((p) => [p.id, p.full_name])
        );

        setMessages(enrichMessages(data as Message[], nameMap));
      }
    }

    loadMessages();

    const channel = supabase
      .channel(`chat-${buildRequestId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `build_request_id=eq.${buildRequestId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;

          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", newMsg.sender_id)
            .single();

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;

            const parent = newMsg.reply_to_id
              ? prev.find((m) => m.id === newMsg.reply_to_id)
              : undefined;

            const reply_to = parent
              ? {
                  id: parent.id,
                  content: parent.content,
                  sender_name: parent.sender_name,
                }
              : null;

            const enriched: Message = {
              ...newMsg,
              sender_name: profile?.full_name ?? "User",
              reply_to,
            };

            if (newMsg.reply_to_id && !reply_to) {
              resolveReplyPreview(supabase, newMsg.reply_to_id, prev).then(
                (resolved) => {
                  if (!resolved) return;
                  setMessages((current) =>
                    current.map((m) =>
                      m.id === newMsg.id ? { ...m, reply_to: resolved } : m
                    )
                  );
                }
              );
            }

            return [...prev, enriched];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [buildRequestId, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function startReply(msg: Message) {
    setReplyTo(msg);
    inputRef.current?.focus();
  }

  function cancelReply() {
    setReplyTo(null);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    setSendError("");

    const payload: {
      build_request_id: string;
      sender_id: string;
      content: string;
      reply_to_id?: string;
    } = {
      build_request_id: buildRequestId,
      sender_id: userId,
      content: newMessage.trim(),
    };

    if (replyTo) {
      payload.reply_to_id = replyTo.id;
    }

    const { error: insertError } = await supabase.from("messages").insert(payload);

    if (insertError) {
      setSendError(insertError.message);
    } else {
      setNewMessage("");
      setReplyTo(null);
    }
    setSending(false);
  }

  return (
    <div className="flex flex-col h-full bg-surface-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-surface-light">
        <h3 className="font-medium text-sm text-neutral-900">Live Chat</h3>
        <p className="text-xs text-neutral-500">Tap Reply on a message to respond to it</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[240px] sm:min-h-[300px] max-h-[50vh] sm:max-h-[400px]">
        {messages.length === 0 && (
          <p className="text-center text-neutral-500 text-sm py-8">
            No messages yet. Say hello!
          </p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender_id === userId;
          return (
            <div
              key={msg.id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] flex flex-col gap-1 ${
                  isOwn ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`rounded-2xl px-4 py-2.5 ${
                    isOwn
                      ? "bg-brand-600 text-white rounded-br-sm"
                      : "bg-neutral-100 text-neutral-800 rounded-bl-sm border border-border"
                  }`}
                >
                  {!isOwn && (
                    <p className="text-xs font-medium text-neutral-500 mb-0.5">
                      {msg.sender_name}
                    </p>
                  )}
                  {msg.reply_to && (
                    <div
                      className={`mb-2 pl-2 border-l-2 text-xs ${
                        isOwn
                          ? "border-white/40 text-neutral-200"
                          : "border-neutral-300 text-neutral-500"
                      }`}
                    >
                      <p className="font-medium">{msg.reply_to.sender_name}</p>
                      <p className="line-clamp-2">{truncate(msg.reply_to.content)}</p>
                    </div>
                  )}
                  <p className="text-sm break-words">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwn ? "text-neutral-300" : "text-neutral-400"
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startReply(msg)}
                  className="text-xs text-neutral-500 hover:text-neutral-800 px-1"
                >
                  Reply
                </button>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="p-3 border-t border-border flex flex-col gap-2 bg-white"
      >
        {replyTo && (
          <div className="flex items-start justify-between gap-2 px-3 py-2 bg-neutral-50 border border-border rounded-lg">
            <div className="min-w-0">
              <p className="text-xs font-medium text-neutral-700">
                Replying to {replyTo.sender_name}
              </p>
              <p className="text-xs text-neutral-500 truncate">
                {truncate(replyTo.content, 60)}
              </p>
            </div>
            <button
              type="button"
              onClick={cancelReply}
              className="text-neutral-400 hover:text-neutral-700 text-sm shrink-0"
              aria-label="Cancel reply"
            >
              ✕
            </button>
          </div>
        )}
        {sendError && <p className="text-red-600 text-xs">{sendError}</p>}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={replyTo ? "Write a reply..." : "Type a message..."}
            maxLength={2000}
            className="flex-1 min-w-0 bg-white border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-400 transition-colors"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shrink-0"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
