"use client";

import { useEffect, useState } from "react";

type Props = {
  sessionId: string;
  initialPersistent: boolean;
  initialExpiresAt?: string;
  canCreateNewSession?: boolean;
};

export default function SessionToggle({
  sessionId,
  initialExpiresAt,
  canCreateNewSession = false
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

  const canAct = canCreateNewSession && !busy;

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        disabled={!canAct}
        onClick={() => void terminateNow()}
        title={
          !canCreateNewSession
            ? "Trimite un mesaj si asteapta raspunsul pentru a incepe un chat nou"
            : "Incheie sesiunea si incepe un chat nou"
        }
        className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all ${
          canAct
            ? "border-transparent bg-[#e58b3a] text-white shadow-[0_10px_24px_rgba(229,139,58,0.35)]"
            : "border-[#f2c39a] bg-[#fff1e4] text-[#c8772a] cursor-not-allowed"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
        <span>Sesiune nouă</span>
      </button>
      <span className="sr-only">Regim sesiune: Obisnuita. Expira la: {expiresLabel}</span>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
