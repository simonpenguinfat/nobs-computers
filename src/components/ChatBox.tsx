"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/types";

interface ChatBoxProps {
  buildRequestId: string;
  userId: string;
  userName: string;
}

export default function ChatBox({ buildRequestId, userId, userName }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
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

        setMessages(
          data.map((m) => ({
            ...m,
            sender_name: nameMap.get(m.sender_id) ?? "User",
          }))
        );
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

          setMessages((prev) => [
            ...prev,
            { ...newMsg, sender_name: profile?.full_name ?? "User" },
          ]);
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

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const { error: sendError } = await supabase.from("messages").insert({
      build_request_id: buildRequestId,
      sender_id: userId,
      content: newMessage.trim(),
    });
    if (!sendError) {
      setNewMessage("");
    }
    setSending(false);
  }

  return (
    <div className="flex flex-col h-full bg-surface-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-surface-light">
        <h3 className="font-medium text-sm text-neutral-900">Live Chat</h3>
        <p className="text-xs text-neutral-500">Messages appear instantly</p>
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
            <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 ${
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
                <p className="text-sm break-words">{msg.content}</p>
                <p className={`text-xs mt-1 ${isOwn ? "text-neutral-300" : "text-neutral-400"}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-border flex gap-2 bg-white">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 min-w-0 bg-white border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-400 transition-colors"
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shrink-0"
        >
          Send
        </button>
      </form>
    </div>
  );
}
