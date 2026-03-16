"use client";

import { useCallback, useEffect, useState } from "react";

import MessageBubble, { type ChatMessageVM } from "@/components/chat/MessageBubble";
import PromptCards from "@/components/chat/PromptCards";
import SessionToggle from "@/components/chat/SessionToggle";
import TypingDots from "@/components/chat/TypingDots";
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
  const [sessionInitState, setSessionInitState] = useState<"unknown" | "empty" | "history">(
    "unknown"
  );
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  const canSend = input.trim().length > 0 && !loading;
  const isEmpty = messages.length === 0;
  const isFreshSession = sessionInitState === "empty";

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
    setSessionInitState((prev) =>
      prev === "unknown" ? (filtered.length === 0 ? "empty" : "history") : prev
    );

    if (filtered.some((m) => m.role === "assistant" && m.content.length > 0)) {
      setHasResponse(true);
    }
  }, [sessionId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (!pendingPrompt) return;
    if (loading) return;
    if (input.trim() !== pendingPrompt.trim()) {
      setPendingPrompt(null);
      return;
    }
    void sendMessage();
    setPendingPrompt(null);
  }, [pendingPrompt, input, loading]);

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
      setError(sendError instanceof Error ? sendError.message : "Eroare la trimitere");
    } finally {
      setLoading(false);
    }
  }

  const showWelcome = isEmpty && sessionInitState !== "history";
  const showGreeting =
    messages.length > 0 && (isFreshSession || sessionInitState === "unknown");

  return (
    <div className="relative left-1/2 right-1/2 -my-6 h-[calc(100dvh-64px)] w-[100dvw] -ml-[50dvw] -mr-[50dvw] overflow-hidden bg-page">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 right-[-80px] h-72 w-72 rounded-full bg-orange-100/80 blur-3xl" />
        <div className="absolute bottom-[-120px] left-[-80px] h-72 w-72 rounded-full bg-orange-50/80 blur-3xl" />
      </div>
      <div className="relative flex h-full w-full flex-col px-4 py-4 sm:px-6">
        <header className="flex items-center justify-between pb-4 pt-2 sm:pb-6">
          {showSessionControls ? (
            <div className="w-fit">
              <SessionToggle
                sessionId={sessionId}
                initialPersistent={initialPersistent}
                initialExpiresAt={initialExpiresAt}
                canCreateNewSession={hasResponse}
              />
            </div>
          ) : null}
        </header>

        <main className="flex min-h-0 flex-1 flex-col pb-8 pt-2 sm:pb-10">
          <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-8 sm:gap-12">
            {showWelcome ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-8 pb-6 text-center">
                <div>
                  <h1 className="text-4xl font-semibold text-[#e58b3a] sm:text-5xl">
                    Bine ai venit!
                  </h1>
                  <p className="mt-2 text-2xl font-semibold text-[#e58b3a] sm:text-3xl">
                    Cum te pot ajuta astăzi?
                  </p>
                </div>
                <div className="w-full max-w-[920px] text-left">
                  <p className="mb-3 text-sm font-semibold text-slate-500">
                    Prompt-uri sugerate:
                  </p>
                  <PromptCards
                    layout="grid"
                    onPick={(content) => {
                      setInput(content);
                      setPendingPrompt(content);
                    }}
                  />
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="w-full rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {!showWelcome ? (
              <div className="w-full flex-1 min-h-0">
                <div className="flex min-h-0 flex-col gap-6 overflow-y-auto pr-2 sm:gap-10">
                  {showGreeting ? (
                    <div className="flex items-start gap-4 sm:gap-5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e58b3a] shadow-[0_8px_20px_rgba(15,23,42,0.12)]">
                        <svg
                          viewBox="0 0 44 44"
                          fill="none"
                          className="h-6 w-6"
                          aria-hidden="true"
                        >
                          <path
                            d="M36.6849 21.2862H36.4312C35.3896 16.6304 31.232 13.134 26.2682 13.134H23.0979V11.9746C24.674 11.413 25.8153 9.91845 25.8153 8.15214C25.8153 5.90577 23.9856 4.07606 21.7392 4.07606C19.4928 4.07606 17.6631 5.90577 17.6631 8.15214C17.6631 9.91845 18.8044 11.413 20.3805 11.9746V13.134H17.2102C12.2465 13.134 8.08885 16.6304 7.04719 21.2862H6.79356C5.299 21.2862 4.07617 22.509 4.07617 24.0036V26.721C4.07617 28.2155 5.299 29.4384 6.79356 29.4384H7.29175C8.36059 32.7717 11.0599 35.3623 14.4475 36.3043C14.1939 36.8387 14.0399 37.4184 14.0399 38.0434C14.0399 38.7953 14.6468 39.4021 15.3986 39.4021H28.0798C28.8316 39.4021 29.4385 38.7953 29.4385 38.0434C29.4385 37.4184 29.2845 36.8297 29.0309 36.3043C32.4186 35.3713 35.1178 32.7717 36.1867 29.4384H36.6849C38.1794 29.4384 39.4023 28.2155 39.4023 26.721V24.0036C39.4023 22.509 38.1794 21.2862 36.6849 21.2862ZM21.7392 6.79345C22.491 6.79345 23.0979 7.40033 23.0979 8.15214C23.0979 8.90395 22.491 9.51084 21.7392 9.51084C20.9874 9.51084 20.3805 8.90395 20.3805 8.15214C20.3805 7.40033 20.9874 6.79345 21.7392 6.79345ZM26.2682 33.9674H17.2102C12.962 33.9674 9.51095 30.5163 9.51095 26.2681V23.5507C9.51095 19.3025 12.962 15.8514 17.2102 15.8514H26.2682C30.5164 15.8514 33.9675 19.3025 33.9675 23.5507V26.2681C33.9675 30.5163 30.5164 33.9674 26.2682 33.9674Z"
                            fill="white"
                          />
                          <path
                            d="M16.7573 19.4746C15.2628 19.4746 14.0399 20.6974 14.0399 22.192V24.9094C14.0399 26.404 15.2628 27.6268 16.7573 27.6268C18.2519 27.6268 19.4747 26.404 19.4747 24.9094V22.192C19.4747 20.6974 18.2519 19.4746 16.7573 19.4746Z"
                            fill="white"
                          />
                          <path
                            d="M26.7211 19.4746C25.2265 19.4746 24.0037 20.6974 24.0037 22.192V24.9094C24.0037 26.404 25.2265 27.6268 26.7211 27.6268C28.2157 27.6268 29.4385 26.404 29.4385 24.9094V22.192C29.4385 20.6974 28.2157 19.4746 26.7211 19.4746Z"
                            fill="white"
                          />
                          <path
                            d="M12.2555 6.72098L14.9729 7.62678C15.1178 7.67207 15.2628 7.69924 15.3986 7.69924C15.9693 7.69924 16.4946 7.33693 16.6849 6.76627C16.9204 6.05069 16.5399 5.28077 15.8244 5.04526L13.107 4.13946C12.4004 3.90395 11.6305 4.28439 11.386 4.99997C11.1414 5.71555 11.5309 6.48548 12.2465 6.72098H12.2555Z"
                            fill="white"
                          />
                          <path
                            d="M12.6812 12.2282C12.8262 12.2282 12.9711 12.2101 13.107 12.1558L15.8244 11.25C16.5399 11.0145 16.9204 10.2445 16.6849 9.52895C16.4494 8.81337 15.6794 8.43294 14.9639 8.66845L12.2465 9.57424C11.5309 9.80975 11.1504 10.5797 11.386 11.2953C11.5762 11.8659 12.1015 12.2282 12.6722 12.2282H12.6812Z"
                            fill="white"
                          />
                          <path
                            d="M28.0798 7.69924C28.2247 7.69924 28.3696 7.68113 28.5055 7.62678L31.2229 6.72098C31.9385 6.48548 32.3189 5.71555 32.0834 4.99997C31.8479 4.28439 31.078 3.90395 30.3624 4.13946L27.645 5.04526C26.9294 5.28077 26.549 6.05069 26.7845 6.76627C26.9747 7.33693 27.5001 7.69924 28.0707 7.69924H28.0798Z"
                            fill="white"
                          />
                          <path
                            d="M27.6541 11.25L30.3715 12.1558C30.5164 12.2011 30.6613 12.2282 30.7972 12.2282C31.3678 12.2282 31.8932 11.8659 32.0834 11.2953C32.3189 10.5797 31.9385 9.80975 31.2229 9.57424L28.5055 8.66845C27.799 8.43294 27.02 8.81337 26.7845 9.52895C26.549 10.2445 26.9294 11.0145 27.645 11.25H27.6541Z"
                            fill="white"
                          />
                        </svg>
                      </div>
                      <div className="w-full rounded-3xl border border-border bg-card px-5 py-3 text-[15px] leading-relaxed text-slate-800 shadow-[0_12px_30px_rgba(15,23,42,0.08)] sm:px-6 sm:py-4">
                        Bună ziua! 👋 Sunt asistentul HR. Vă voi ajuta să găsiți postul vacant
                        potrivit, vă voi explica procesul de angajare și voi analiza CV-ul.
                        <br />
                        Cu ce vă pot ajuta?
                      </div>
                    </div>
                  ) : null}
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
              </div>
            ) : null}

            <div className="mt-auto w-full">
              {!isEmpty && loading ? (
                <p className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.3em] text-slate-400">
                  Se trimite mesajul
                  <TypingDots className="text-slate-400" size="sm" />
                </p>
              ) : null}
              <form
                onSubmit={async (event) => {
                  event.preventDefault();
                  await sendMessage();
                }}
                className="flex items-center gap-3 rounded-full bg-card px-5 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.12)] ring-1 ring-black/5 transition focus-within:ring-2 focus-within:ring-[#f2c39a] sm:px-8 sm:py-4"
              >
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Scrie un mesaj..."
                  disabled={loading}
                  className="flex-1 bg-transparent text-[15px] text-slate-800 outline-none placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!canSend}
                  className={`flex h-11 w-11 items-center justify-center rounded-full transition-all sm:h-12 sm:w-12 ${
                    canSend
                      ? "bg-[#e58b3a] text-white shadow-[0_12px_26px_rgba(233,139,58,0.4)]"
                      : "bg-[#f3d2b1] text-white/70 cursor-not-allowed"
                  }`}
                  aria-label={loading ? "Sending message" : "Send message"}
                >
                  {loading ? (
                    <TypingDots className="text-white" size="sm" />
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <path d="M10.7 13.3 19 5" />
                      <path d="M19 5 14 19l-3.3-5.7L5 10l14-5Z" />
                    </svg>
                  )}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

