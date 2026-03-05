"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  initialPersistent: boolean;
  initialExpiresAt?: string;
};

export default function SessionToggle({ initialPersistent, initialExpiresAt }: Props) {
  const [persistent, setPersistent] = useState(initialPersistent);
  const [expiresAt, setExpiresAt] = useState<string | undefined>(initialExpiresAt);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expiresLabel = useMemo(() => {
    if (!expiresAt) return "unknown";
    return new Date(expiresAt).toLocaleString();
  }, [expiresAt]);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      const response = await fetch("/api/session/mode", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as {
        persistent: boolean;
        expiresAt: string;
      };
      setPersistent(data.persistent);
      setExpiresAt(data.expiresAt);
    }, 30_000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (persistent) {
      return;
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        window.setTimeout(() => {
          if (document.visibilityState === "hidden") {
            void fetch("/api/session/terminate", {
              method: "POST",
              keepalive: true
            });
          }
        }, 400);
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [persistent]);

  async function changeMode(nextPersistent: boolean) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/session/mode", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ persistent: nextPersistent })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to switch mode");
      }

      const data = (await response.json()) as {
        persistent: boolean;
        expiresAt: string;
      };
      setPersistent(data.persistent);
      setExpiresAt(data.expiresAt);
    } catch (switchError) {
      setError(switchError instanceof Error ? switchError.message : "Failed to switch mode");
    } finally {
      setBusy(false);
    }
  }

  async function terminateNow() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/session/terminate", {
        method: "POST"
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to terminate session");
      }

      window.location.href = "/login";
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
          <div style={{ fontWeight: 600 }}>Session mode: {persistent ? "Persistent" : "Ephemeral"}</div>
          <div style={{ fontSize: 12, color: "#475467" }}>Expires at: {expiresLabel}</div>
          {!persistent ? (
            <div style={{ fontSize: 12, color: "#b54708" }}>
              В ephemeral режиме сессия завершается при скрытии вкладки.
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <button type="button" disabled={busy || persistent} onClick={() => void changeMode(true)}>
            Persistent
          </button>
          <button type="button" disabled={busy || !persistent} onClick={() => void changeMode(false)}>
            Ephemeral
          </button>
          <button type="button" disabled={busy} onClick={() => void terminateNow()}>
            Terminate
          </button>
        </div>
      </div>

      {error ? <p style={{ color: "#b42318", marginTop: 8 }}>{error}</p> : null}
    </div>
  );
}
