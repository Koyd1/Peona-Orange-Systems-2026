"use client";

import { useEffect, useMemo, useState } from "react";

import MessageBubble, { type ChatMessageVM } from "@/components/chat/MessageBubble";
import type { ChatSource } from "@/components/chat/SourceCard";

type Props = {
  sessionId: string;
};

type SSEEvent =
  | { type: "sources"; data: ChatSource[] }
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

export default function ChatWindow({ sessionId }: Props) {
  const [messages, setMessages] = useState<ChatMessageVM[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  useEffect(() => {
    async function loadHistory() {
      const response = await fetch("/api/chat", { cache: "no-store" });
      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as {
        items: Array<{
          id: string;
          role: "user" | "assistant" | "system";
          content: string;
          sources?: ChatSource[];
        }>;
      };

      setMessages(
        payload.items
          .filter((item) => item.role === "user" || item.role === "assistant")
          .map((item) => ({
            id: item.id,
            role: item.role as "user" | "assistant",
            content: item.content,
            sources: item.sources
          }))
      );
    }

    void loadHistory();
  }, []);

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

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const { events, rest } = parseSSELines(buffer);
        buffer = rest;

        for (const event of events) {
          if (event.type === "sources") {
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
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantId
                  ? {
                      ...msg,
                      content: msg.content + event.data,
                      sources: latestSources
                    }
                  : msg
              )
            );
          }

          if (event.type === "done") {
            const finalAnswer = event.data?.answer ?? "";
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantId
                  ? {
                      ...msg,
                      content: finalAnswer || msg.content,
                      sources: latestSources
                    }
                  : msg
              )
            );
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
    <div className="card">
      <h1 style={{ marginTop: 0 }}>Chat</h1>
      <p style={{ marginTop: 0 }}>Session: {sessionId}</p>

      {error ? <p style={{ color: "#b42318" }}>{error}</p> : null}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          maxHeight: 420,
          overflowY: "auto",
          marginBottom: 12,
          paddingRight: 4
        }}
      >
        {messages.length === 0 ? <p>Пока нет сообщений.</p> : null}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>

      <form
        onSubmit={async (event) => {
          event.preventDefault();
          await sendMessage();
        }}
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Введите вопрос..."
          disabled={loading}
        />
        <button type="submit" disabled={!canSend}>
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
