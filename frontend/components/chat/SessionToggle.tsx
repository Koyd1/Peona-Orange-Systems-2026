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
    <div className="border border-gray-300 rounded-lg p-2.5 mb-3 bg-slate-50">
      <div className="flex justify-between gap-3">
        <div>
          <div className="font-semibold">Режим сессии: Обычная</div>
          <div className="text-xs text-gray-500">
            Expires at: {expiresLabel}
          </div>
        </div>

        <div className="flex gap-2 items-start">
          <button
            type="button"
            disabled={!canAct}
            onClick={() => void terminateNow()}
            title={
              !canCreateNewSession
                ? "Отправьте хотя бы одно сообщение и дождитесь ответа"
                : "Завершить сессию и начать новую"
            }
            className={`inline-flex items-center rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-semibold font-sans transition-all ${
              canAct
                ? "bg-white text-gray-800 cursor-pointer hover:bg-gray-50"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            Новый чат
          </button>
        </div>
      </div>

      {!canCreateNewSession ? (
        <p className="text-xs text-gray-500 mt-2">
          Отправьте сообщение и дождитесь ответа, чтобы начать новый чат.
        </p>
      ) : null}

      {error ? <p className="text-red-700 mt-2">{error}</p> : null}
    </div>
  );
}
