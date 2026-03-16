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
  if (status === "unavailable") return { text: "N/A", color: "#475467", bg: "#f2f4f7" };
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
    <section className="rounded-[30px] border border-[#e8eaf1] bg-white px-5 py-6 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.65)] md:px-7">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="m-0 text-[1.7rem] font-bold tracking-[-0.02em] text-[#111827]">Health monitor</h2>
        <span
          className="w-fit rounded-full px-4 py-1.5 text-xs font-bold tracking-[0.06em]"
          style={{
            background: badge.bg,
            color: badge.color,
          }}
        >
          {loading ? "..." : badge.text}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-2xl border border-[#e9edf5] bg-[#fbfcff] p-4">
          <h3 className="m-0 text-sm font-semibold uppercase tracking-[0.06em] text-[#98a2b3]">OpenAI</h3>
          <p className="mt-2 text-lg font-bold text-[#111827]">{data?.openai?.ok ? "OK" : "FAIL"}</p>
          <p className="m-0 text-sm text-[#667085]">Latency: {data?.openai?.latencyMs ?? "-"} ms</p>
        </article>
        <article className="rounded-2xl border border-[#e9edf5] bg-[#fbfcff] p-4">
          <h3 className="m-0 text-sm font-semibold uppercase tracking-[0.06em] text-[#98a2b3]">Redis</h3>
          <p className="mt-2 text-lg font-bold text-[#111827]">{data?.redis?.ok ? "OK" : "FAIL"}</p>
          <p className="m-0 text-sm text-[#667085]">Latency: {data?.redis?.latencyMs ?? "-"} ms</p>
        </article>
        <article className="rounded-2xl border border-[#e9edf5] bg-[#fbfcff] p-4">
          <h3 className="m-0 text-sm font-semibold uppercase tracking-[0.06em] text-[#98a2b3]">Database</h3>
          <p className="mt-2 text-lg font-bold text-[#111827]">{data?.database?.ok ? "OK" : "FAIL"}</p>
          <p className="m-0 text-sm text-[#667085]">Latency: {data?.database?.latencyMs ?? "-"} ms</p>
          <p className="m-0 text-sm text-[#667085]">Chunks: {data?.database?.chunkCount ?? 0}</p>
        </article>
      </div>

      <div className="mt-3 rounded-2xl border border-[#e9edf5] bg-[#f8faff] p-4">
        <h3 className="m-0 text-sm font-semibold uppercase tracking-[0.06em] text-[#98a2b3]">
          Hallucination 24h
        </h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <p className="m-0 text-sm text-[#344054]">
            Average: <strong>{(data?.hallucination?.avg24h ?? 0).toFixed(3)}</strong>
          </p>
          <p className="m-0 text-sm text-[#344054]">
            Samples: <strong>{data?.hallucination?.sampleSize ?? 0}</strong>
          </p>
        </div>
      </div>

      <small className="mt-4 block text-sm text-[#98a2b3]">
        Updated: {data?.timestamp ? new Date(data.timestamp).toLocaleString() : "n/a"}
      </small>
    </section>
  );
}
