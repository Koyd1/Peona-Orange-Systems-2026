"use client";

import { useState } from "react";

export default function FeedbackButtons({
  sessionId,
  messageId,
  initialRating,
  initialComment,
  onSaved
}: {
  sessionId: string;
  messageId: string;
  initialRating?: 1 | -1;
  initialComment?: string | null;
  onSaved?: (payload: { rating: 1 | -1; comment: string | null }) => void;
}) {
  const [rating, setRating] = useState<1 | -1 | undefined>(initialRating);
  const [comment, setComment] = useState(initialComment ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(nextRating: 1 | -1) {
    if (rating !== undefined) {
      return;
    }

    const nextComment = comment.trim() || null;
    const previousRating = rating;
    const previousComment = comment;

    // Optimistic UI: mark as saved immediately and rollback on API error.
    setRating(nextRating);
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          messageId,
          rating: nextRating,
          comment: nextComment ?? undefined
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Feedback submit failed");
      }
      onSaved?.({ rating: nextRating, comment: nextComment });
    } catch (submitError) {
      setRating(previousRating);
      setComment(previousComment);
      setError(submitError instanceof Error ? submitError.message : "Feedback submit failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: 10, borderTop: "1px solid #e4e7ec", paddingTop: 8 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: "#475467" }}>Feedback:</span>
        <button
          type="button"
          disabled={busy || rating !== undefined}
          onClick={() => void submit(1)}
          title="Helpful"
        >
          👍
        </button>
        <button
          type="button"
          disabled={busy || rating !== undefined}
          onClick={() => void submit(-1)}
          title="Not helpful"
        >
          👎
        </button>
        {rating !== undefined ? (
          <span style={{ fontSize: 12, color: "#027a48" }}>saved</span>
        ) : null}
      </div>

      {rating === undefined ? (
        <input
          placeholder="Комментарий (опционально)"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={600}
          disabled={busy}
        />
      ) : null}

      {error ? <p style={{ color: "#b42318", marginBottom: 0 }}>{error}</p> : null}
    </div>
  );
}
