"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import MessageBubble, { type ChatMessageVM } from "@/components/chat/MessageBubble";
import PromptCards from "@/components/chat/PromptCards";
import SessionToggle from "@/components/chat/SessionToggle";
import type { ChatSource } from "@/components/chat/SourceCard";

type Props = {
  sessionId: string;
  initialPersistent: boolean;
  initialExpiresAt?: string;
  showSessionControls?: boolean;
};

type SSEEvent =
  | { type: "sources"; data: ChatSource[] }
  | { type: "updated_sources"; data: ChatSource[] }
  | { type: "token"; data: string }
  | { type: "done"; data: { answer: string; session_id: string; hallScore: number } };

function parseSSELines(buffer: string): { events: SSEEvent[]; rest: string } {
  const events: SSEEvent[] = [];
  let remaining = buffer;

  let split = remaining.indexOf("\n\n");
  while (split !== -1) {
    const rawEvent = remaining.slice(0, split);
    remaining = remaining.slice(split + 2);

    const dataLine = rawEvent.split("\n").find((line) => line.startsWith("data: "));
    if (dataLine) {
      try {
        const event = JSON.parse(dataLine.slice(6)) as SSEEvent;
        events.push(event);
      } catch {
        // ignore malformed chunks
      }
    }

    split = remaining.indexOf("\n\n");
  }

  return { events, rest: remaining };
}

export default function ChatWindow({
  sessionId,
  initialPersistent,
  initialExpiresAt,
  showSessionControls = true
}: Props) {
  const [messages, setMessages] = useState<ChatMessageVM[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasResponse, setHasResponse] = useState(false);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const loadHistory = useCallback(async () => {
    const response = await fetch(`/api/chat?sessionId=${encodeURIComponent(sessionId)}`, {
      cache: "no-store"
    });
    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as {
      items: Array<{
        id: string;
        role: "user" | "assistant" | "system";
        content: string;
        sources?: ChatSource[];
        feedbackRating?: number | null;
        feedbackComment?: string | null;
      }>;
    };

    const filtered = payload.items
      .filter((item) => item.role === "user" || item.role === "assistant")
      .map((item) => ({
        id: item.id,
        role: item.role as "user" | "assistant",
        content: item.content,
        sources: item.sources,
        feedbackRating:
          item.feedbackRating === 1 || item.feedbackRating === -1
            ? (item.feedbackRating as 1 | -1)
            : undefined,
        feedbackComment: item.feedbackComment ?? null
      }));

    setMessages(filtered);

    if (filtered.some((m) => m.role === "assistant" && m.content.length > 0)) {
      setHasResponse(true);
    }
  }, [sessionId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  async function sendMessage() {
    const userText = input.trim();
    if (!userText || loading) return;

    setLoading(true);
    setError(null);
    setInput("");

    const userMessage: ChatMessageVM = {
      id: `u-${Date.now()}`,
      role: "user",
      content: userText
    };
    const assistantId = `a-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: assistantId,
        role: "assistant",
        content: ""
      }
    ]);

    try {
      const payloadMessages = [...messages, userMessage].map((message) => ({
        role: message.role,
        content: message.content
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          messages: payloadMessages
        })
      });

      if (!response.ok || !response.body) {
        const text = await response.text();
        throw new Error(text || "Chat stream failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let latestSources: ChatSource[] = [];
      let seenMarker = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const { events, rest } = parseSSELines(buffer);
        buffer = rest;

        for (const event of events) {
          // ignore plain sources events, use updated_sources only
          if (event.type === "sources") {
              continue; 
            }
          // if (event.type === "sources") {
          //   latestSources = event.data;
          //   setMessages((prev) =>
          //     prev.map((msg) =>
          //       msg.id === assistantId
          //         ? {
          //             ...msg,
          //             sources: latestSources
          //           }
          //         : msg
          //     )
          //   );
          // }

          if (event.type === "updated_sources") {
            latestSources = event.data;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantId
                  ? {
                      ...msg,
                      sources: latestSources
                    }
                  : msg
              )
            );
          }

          if (event.type === "token") {
            if (seenMarker) {
              // ignore tokens after marker
              continue;
            }
            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id !== assistantId) return msg;
                let newContent = msg.content + event.data;
                if (newContent.includes("[[SOURCES]]")) {
                  seenMarker = true;
                  newContent = newContent.split("[[SOURCES]]")[0];
                }
                return {
                  ...msg,
                  content: newContent,
                  sources: latestSources
                };
              })
            );
          }

          if (event.type === "done") {
            const finalAnswer = event.data?.answer ?? "";
            const clean = finalAnswer.split("[[SOURCES]]")[0];
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantId
                  ? {
                      ...msg,
                      content: clean || msg.content,
                      sources: latestSources
                    }
                  : msg
              )
            );
            setHasResponse(true);
            window.setTimeout(() => {
              void loadHistory();
            }, 350);
          }
        }
      }
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Ошибка отправки");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl bg-white border border-[#e5e7eb] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <h1 className="mt-0">Chat</h1>
      <p className="mt-0">Session: {sessionId}</p>
      {showSessionControls ? (
        <SessionToggle
          sessionId={sessionId}
          initialPersistent={initialPersistent}
          initialExpiresAt={initialExpiresAt}
          canCreateNewSession={hasResponse}
        />
      ) : null}
      <PromptCards
        onPick={(content) => {
          setInput(content);
        }}
      />

      {error ? <p className="text-red-700">{error}</p> : null}

      <div className="flex flex-col gap-2.5 max-h-[420px] overflow-y-auto mb-3 pr-1">
        {messages.length === 0 ? <p>Пока нет сообщений.</p> : null}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            sessionId={sessionId}
            onFeedbackSaved={(messageId, payload) => {
              setMessages((prev) =>
                prev.map((item) =>
                  item.id === messageId
                    ? {
                        ...item,
                        feedbackRating: payload.rating,
                        feedbackComment: payload.comment
                      }
                    : item
                )
              );
            }}
          />
        ))}
      </div>

      <form
        onSubmit={async (event) => {
          event.preventDefault();
          await sendMessage();
        }}
        className="flex flex-col gap-2"
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Введите вопрос..."
          disabled={loading}
          className="w-full px-3.5 py-3 text-[15px] border border-gray-300 rounded-lg outline-none font-sans bg-white"
        />
        <button
          type="submit"
          disabled={!canSend}
          className={`w-full py-2.5 text-[15px] font-medium font-sans border border-gray-300 rounded-lg bg-gradient-to-b from-[#fafafa] to-[#f0f0f0] transition-all ${
            canSend ? "text-gray-700 cursor-pointer" : "text-gray-400 cursor-not-allowed"
          }`}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
