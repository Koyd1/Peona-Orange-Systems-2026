"use client";

import { useEffect, useState } from "react";

type Props = {
  sessionId: string;
  initialPersistent: boolean;
  initialExpiresAt?: string;
};

export default function SessionToggle({
  sessionId,
  initialExpiresAt
}: Props) {
  const [expiresAt, setExpiresAt] = useState<string | undefined>(initialExpiresAt);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function recoverToFreshSession() {
    window.location.replace(`/chat?renew=${Date.now()}`);
  }

  const expiresLabel = expiresAt
    ? new Date(expiresAt).toISOString().replace("T", " ").replace(".000Z", " UTC")
    : "unknown";

  useEffect(() => {
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/session/mode?sessionId=${encodeURIComponent(sessionId)}`, {
        cache: "no-store"
      });
      if (response.status === 401 || response.status === 404) {
        recoverToFreshSession();
        return;
      }
      if (!response.ok) return;
      const data = (await response.json()) as {
        expiresAt: string;
      };
      setExpiresAt(data.expiresAt);
    }, 30_000);

    return () => window.clearInterval(timer);
  }, [sessionId]);

  async function terminateNow() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/session/terminate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId })
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 404) {
          recoverToFreshSession();
          return;
        }
        const text = await response.text();
        throw new Error(text || "Failed to terminate session");
      }

      recoverToFreshSession();
    } catch (terminateError) {
      setError(
        terminateError instanceof Error ? terminateError.message : "Failed to terminate session"
      );
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        border: "1px solid #d0d5dd",
        borderRadius: 8,
        padding: 10,
        marginBottom: 12,
        background: "#f8fafc"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 600 }}>Режим сессии: Обычная</div>
          <div style={{ fontSize: 12, color: "#475467" }}>
            Expires at: {expiresLabel}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <button type="button" disabled={busy} onClick={() => void terminateNow()}>
            Удалить сессию
          </button>
        </div>
      </div>

      {error ? <p style={{ color: "#b42318", marginTop: 8 }}>{error}</p> : null}
    </div>
  );
}
