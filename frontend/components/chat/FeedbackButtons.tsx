"use client";

import { useState } from "react";

export default function FeedbackButtons({
  messageId,
  initialRating,
  initialComment
}: {
  messageId: string;
  initialRating?: 1 | -1;
  initialComment?: string | null;
}) {
  const [rating, setRating] = useState<1 | -1 | undefined>(initialRating);
  const [comment, setComment] = useState(initialComment ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(nextRating: 1 | -1) {
    if (rating !== undefined) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messageId,
          rating: nextRating,
          comment: comment.trim() || undefined
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Feedback submit failed");
      }

      setRating(nextRating);
    } catch (submitError) {
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
