"use client";

import SourceCard, { type ChatSource } from "@/components/chat/SourceCard";
import FeedbackButtons from "@/components/chat/FeedbackButtons";

export type ChatMessageVM = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  feedbackRating?: 1 | -1;
  feedbackComment?: string | null;
};

export default function MessageBubble({
  message,
  sessionId,
  onFeedbackSaved
}: {
  message: ChatMessageVM;
  sessionId: string;
  onFeedbackSaved?: (messageId: string, payload: { rating: 1 | -1; comment: string | null }) => void;
}) {
  const isUser = message.role === "user";

  return (
    <div
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "85%",
        border: "1px solid #d0d5dd",
        borderRadius: 10,
        padding: 10,
        background: isUser ? "#eaf2ff" : "#ffffff"
      }}
    >
      <div style={{ fontSize: 12, color: "#475467", marginBottom: 4 }}>
        {isUser ? "You" : "Assistant"}
      </div>
      <div style={{ whiteSpace: "pre-wrap" }}>{message.content || "..."}</div>

      {!isUser && message.sources && message.sources.length > 0 ? (
        <div style={{ marginTop: 10 }}>
          {message.sources.map((source, index) => (
            <SourceCard key={`${message.id}-src-${index}`} source={source} />
          ))}
        </div>
      ) : null}

      {!isUser && !message.id.startsWith("a-") ? (
        <FeedbackButtons
          sessionId={sessionId}
          messageId={message.id}
          initialRating={message.feedbackRating}
          initialComment={message.feedbackComment}
          onSaved={(payload) => onFeedbackSaved?.(message.id, payload)}
        />
      ) : null}
    </div>
  );
}
