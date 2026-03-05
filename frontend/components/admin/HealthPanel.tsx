"use client";

import { useEffect, useMemo, useState } from "react";

type HealthPayload = {
  status: "ok" | "warn" | "error" | "unavailable";
  timestamp?: string;
  openai?: { ok: boolean; latencyMs: number; detail?: string };
  redis?: { ok: boolean; latencyMs: number; detail?: string };
  database?: { ok: boolean; latencyMs: number; chunkCount: number; detail?: string };
  hallucination?: { avg24h: number; sampleSize: number; detail?: string };
};

const POLL_MS = 30000;

function asBadge(status: HealthPayload["status"]) {
  if (status === "ok") return { text: "OK", color: "#166534", bg: "#dcfce7" };
  if (status === "warn") return { text: "WARN", color: "#92400e", bg: "#fef3c7" };
  return { text: "ERROR", color: "#991b1b", bg: "#fee2e2" };
}

export function HealthPanel() {
  const [data, setData] = useState<HealthPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch("/api/health", { cache: "no-store" });
        const payload = (await response.json()) as HealthPayload;
        if (!cancelled) setData(payload);
      } catch {
        if (!cancelled) setData({ status: "unavailable" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    const id = window.setInterval(() => void load(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const badge = useMemo(() => asBadge(data?.status ?? "unavailable"), [data?.status]);

  return (
    <section className="card" style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Health monitor</h2>
        <span
          style={{
            background: badge.bg,
            color: badge.color,
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700
          }}
        >
          {loading ? "..." : badge.text}
        </span>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <div>OpenAI: {data?.openai?.ok ? "OK" : "FAIL"} ({data?.openai?.latencyMs ?? "-"} ms)</div>
        <div>Redis: {data?.redis?.ok ? "OK" : "FAIL"} ({data?.redis?.latencyMs ?? "-"} ms)</div>
        <div>
          Database: {data?.database?.ok ? "OK" : "FAIL"} ({data?.database?.chunkCount ?? 0} chunks,{" "}
          {data?.database?.latencyMs ?? "-"} ms)
        </div>
        <div>
          Hallucination 24h: avg {(data?.hallucination?.avg24h ?? 0).toFixed(3)} | samples{" "}
          {data?.hallucination?.sampleSize ?? 0}
        </div>
      </div>

      <small style={{ opacity: 0.7 }}>
        Updated: {data?.timestamp ? new Date(data.timestamp).toLocaleString() : "n/a"}
      </small>
    </section>
  );
}
