"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ServiceStatus = {
  ok: boolean;
  latencyMs: number;
  detail?: string;
  model?: string;
  chunkCount?: number;
  messageCount?: number;
};

type UsageSummary = {
  requests: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  spendUsd: number;
  avgLatencyMs?: number | null;
};

type UsageWindow = {
  exact: UsageSummary;
  estimatedLegacy: UsageSummary;
  combined: Omit<UsageSummary, "avgLatencyMs">;
};

type UsageRow = {
  operation?: string | null;
  model?: string | null;
  requests: number;
  exactTokens: number;
  estimatedTokens: number;
  totalTokens: number;
  costTotalUsd: number;
  avgLatencyMs?: number | null;
  missingPricing: boolean;
};

type QualityWindow = {
  messages: number;
  avgHallScore: number;
  p95HallScore: number;
  judgedSamples: number;
  heuristicSamples: number;
  highRiskCount: number;
  negativeFeedbackOverlapCount: number;
};

type RiskyAnswer = {
  messageId: string;
  sessionId: string;
  createdAt: string;
  model: string;
  hallScore: number;
  hallReason: string;
  hallScoreSource: string;
  feedbackRating?: number | null;
  answerExcerpt: string;
};

type HealthPayload = {
  status: "ok" | "warn" | "error" | "unavailable";
  timestamp?: string;
  services: {
    status: "ok" | "warn" | "error";
    openai: ServiceStatus;
    redis: ServiceStatus;
    database: ServiceStatus;
  };
  usage: {
    status: "ok" | "warn" | "error";
    windows: Record<"24h" | "7d" | "30d", UsageWindow>;
    trends30d: Array<{
      day: string;
      exactTokens: number;
      estimatedTokens: number;
      exactSpendUsd: number;
      estimatedSpendUsd: number;
      requests: number;
    }>;
    operations30d: UsageRow[];
    models30d: UsageRow[];
  };
  quality: {
    status: "ok" | "warn" | "error";
    windows: Record<"24h" | "7d" | "30d", QualityWindow>;
    trends30d: Array<{
      day: string;
      avgHallScore: number;
      p95HallScore: number;
      maxHallScore: number;
      judgedSamples: number;
      heuristicSamples: number;
      highRiskCount: number;
      negativeFeedbackCount: number;
    }>;
    reasonBreakdown30d: Array<{ reason: string; count: number }>;
    riskBuckets30d: Array<{ bucket: string; count: number }>;
    riskyAnswers: RiskyAnswer[];
  };
  coverage: {
    status: "ok" | "warn" | "error";
    telemetryCoverage30d: {
      assistantMessages: number;
      withExactUsage: number;
      withoutUsage: number;
      coveragePct: number;
    };
    judgeCoverage30d: {
      assistantMessages: number;
      judged: number;
      heuristicOnly: number;
      coveragePct: number;
    };
    missingPricingModels: string[];
    lastExactUsageEventAt?: string | null;
    legacyEstimateMessages30d: number;
  };
};

const POLL_MS = 30000;

function asBadge(status: HealthPayload["status"] | "ok" | "warn" | "error") {
  if (status === "ok") return { text: "OK", color: "#166534", bg: "#dcfce7" };
  if (status === "warn") return { text: "WARN", color: "#92400e", bg: "#fef3c7" };
  if (status === "unavailable") return { text: "N/A", color: "#475467", bg: "#f2f4f7" };
  return { text: "ERROR", color: "#991b1b", bg: "#fee2e2" };
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "n/a";
  return new Intl.NumberFormat("en-US").format(value);
}

function formatUsd(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "n/a";
  return `$${value.toFixed(value >= 1 ? 2 : 4)}`;
}

function formatPct(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "n/a";
  return `${value.toFixed(1)}%`;
}

function emptyUsageWindow(): UsageWindow {
  return {
    exact: { requests: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0, spendUsd: 0 },
    estimatedLegacy: { requests: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0, spendUsd: 0 },
    combined: { requests: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0, spendUsd: 0 },
  };
}

function emptyQualityWindow(): QualityWindow {
  return {
    messages: 0,
    avgHallScore: 0,
    p95HallScore: 0,
    judgedSamples: 0,
    heuristicSamples: 0,
    highRiskCount: 0,
    negativeFeedbackOverlapCount: 0,
  };
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className="rounded-2xl border border-[#e9edf5] bg-[#fbfcff] p-4">
      <h4 className="m-0 text-xs font-semibold uppercase tracking-[0.06em] text-[#98a2b3]">{label}</h4>
      <p className="mt-2 text-[1.8rem] font-bold text-[#111827]">{value}</p>
      <p className="m-0 text-sm text-[#667085]">{hint}</p>
    </article>
  );
}

function trimReason(reason: string, max = 150) {
  if (reason.length <= max) return reason;
  return `${reason.slice(0, max).trimEnd()}...`;
}

function ServiceCard({
  title,
  body,
  extra,
}: {
  title: string;
  body?: ServiceStatus;
  extra?: string | null;
}) {
  return (
    <article className="rounded-2xl border border-[#e9edf5] bg-[#fbfcff] p-4">
      <h4 className="m-0 text-sm font-semibold uppercase tracking-[0.06em] text-[#98a2b3]">{title}</h4>
      <p className="mt-2 text-lg font-bold text-[#111827]">{body?.ok ? "OK" : "FAIL"}</p>
      <p className="m-0 text-sm text-[#667085]">Latency: {body?.latencyMs ?? "-"} ms</p>
      {extra ? <p className="m-0 mt-1 text-sm text-[#667085]">{extra}</p> : null}
      {body?.detail ? <p className="m-0 mt-1 text-sm text-[#b54708]">{body.detail}</p> : null}
    </article>
  );
}

function WindowTable({
  usage,
  quality,
}: {
  usage: Record<"24h" | "7d" | "30d", UsageWindow>;
  quality: Record<"24h" | "7d" | "30d", QualityWindow>;
}) {
  const rows: Array<"24h" | "7d" | "30d"> = ["24h", "7d", "30d"];

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#edf0f5] bg-white">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead className="bg-[#fafbfe]">
          <tr className="border-b border-[#eef1f5]">
            <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">Window</th>
            <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">Exact tokens</th>
            <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">Legacy tokens</th>
            <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">Avg risk</th>
            <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">Judged</th>
            <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">Needs review</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((label) => (
            <tr key={label} className="border-b border-[#eef1f5] text-[#1f2937]">
              <td className="px-4 py-3 font-medium">{label}</td>
              <td className="px-4 py-3">{formatNumber(usage[label].exact.totalTokens)}</td>
              <td className="px-4 py-3">{formatNumber(usage[label].estimatedLegacy.totalTokens)}</td>
              <td className="px-4 py-3">{quality[label].avgHallScore.toFixed(3)}</td>
              <td className="px-4 py-3">{formatNumber(quality[label].judgedSamples)}</td>
              <td className="px-4 py-3">{formatNumber(quality[label].highRiskCount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ModelTable({ rows }: { rows: UsageRow[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#edf0f5] bg-white">
      <table className="w-full min-w-[680px] border-collapse text-sm">
        <thead className="bg-[#fafbfe]">
          <tr className="border-b border-[#eef1f5]">
            <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">Model</th>
            <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">Operation</th>
            <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">Tokens</th>
            <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">Spend</th>
            <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">Latency</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 6).map((row) => (
            <tr key={`${row.model}-${row.operation}`} className="border-b border-[#eef1f5] text-[#1f2937]">
              <td className="px-4 py-3">{row.model}</td>
              <td className="px-4 py-3">{row.operation}</td>
              <td className="px-4 py-3">
                {formatNumber(row.totalTokens)}
                {row.estimatedTokens > 0 ? (
                  <span className="ml-2 text-xs text-[#98a2b3]">legacy {formatNumber(row.estimatedTokens)}</span>
                ) : null}
              </td>
              <td className="px-4 py-3">
                {formatUsd(row.costTotalUsd)}
                {row.missingPricing ? <span className="ml-2 text-xs text-[#b54708]">pricing gap</span> : null}
              </td>
              <td className="px-4 py-3">{row.avgLatencyMs ? `${row.avgLatencyMs} ms` : "n/a"}</td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-sm text-[#98a2b3]">
                No model usage yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

export function HealthPanel() {
  const [data, setData] = useState<HealthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch("/api/health", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load health payload");
        }
        const payload = (await response.json()) as HealthPayload;
        if (!cancelled) {
          setData(payload);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setData(null);
          setError(loadError instanceof Error ? loadError.message : "Load error");
        }
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

  const usage24h = data?.usage.windows["24h"] ?? emptyUsageWindow();
  const usage30d = data?.usage.windows["30d"] ?? emptyUsageWindow();
  const quality30d = data?.quality.windows["30d"] ?? emptyQualityWindow();
  const latestRisk = data?.quality.riskyAnswers?.[0] ?? null;
  const exactEmpty = (data?.coverage.telemetryCoverage30d.withExactUsage ?? 0) === 0;
  const trendData = (data?.usage.trends30d ?? []).map((item) => ({
    day: item.day.slice(5),
    Exact: item.exactTokens,
    Legacy: item.estimatedTokens,
  }));
  const qualityTrendData = (data?.quality.trends30d ?? []).map((item) => ({
    day: item.day.slice(5),
    Average: item.avgHallScore,
    P95: item.p95HallScore,
    Max: item.maxHallScore,
  }));

  return (
    <section className="space-y-7">
      <section className="rounded-[30px] border border-[#e8eaf1] bg-white px-5 py-6 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.65)] md:px-7">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="m-0 text-[1.7rem] font-bold tracking-[-0.02em] text-[#111827]">Health monitor</h2>
            <p className="mt-2 text-sm text-[#667085]">
              One compact view for service status, AI usage, model spend, and answer quality.
            </p>
          </div>
          <span
            className="w-fit rounded-full px-4 py-1.5 text-xs font-bold tracking-[0.06em]"
            style={{ background: badge.bg, color: badge.color }}
          >
            {loading ? "..." : badge.text}
          </span>
        </div>

        {error ? (
          <div className="rounded-2xl border border-[#fecaca] bg-[#fff5f5] px-4 py-3 text-sm text-[#991b1b]">
            {error}
          </div>
        ) : null}

        {exactEmpty ? (
          <div className="mb-4 rounded-2xl border border-[#fed7aa] bg-[#fff7ed] px-4 py-3 text-sm text-[#9a3412]">
            Exact telemetry is empty because no new chat has been recorded after the telemetry rollout yet.
            Send a new message in chat after restarting the app to populate exact tokens, exact spend, and judge usage.
          </div>
        ) : null}

        {data?.coverage.missingPricingModels.length ? (
          <div className="mb-4 rounded-2xl border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-sm text-[#92400e]">
            Missing pricing for: {data.coverage.missingPricingModels.join(", ")}
          </div>
        ) : null}

        <small className="block text-sm text-[#98a2b3]">
          Updated: {data?.timestamp ? new Date(data.timestamp).toLocaleString() : "n/a"}
        </small>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <ServiceCard title="OpenAI" body={data?.services.openai} extra={data?.services.openai.model ? `Model: ${data.services.openai.model}` : null} />
        <ServiceCard title="Redis" body={data?.services.redis} />
        <ServiceCard
          title="Database"
          body={data?.services.database}
          extra={`Chunks: ${formatNumber(data?.services.database.chunkCount)} | Messages: ${formatNumber(data?.services.database.messageCount)}`}
        />
      </section>

      <section className="rounded-[30px] border border-[#e8eaf1] bg-white px-5 py-6 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.65)] md:px-7">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="m-0 text-[1.35rem] font-bold text-[#111827]">Usage snapshot</h3>
          <span className="text-sm text-[#98a2b3]">24h + 30d summary</span>
        </div>

        <div className="grid gap-3 lg:grid-cols-4">
          <StatCard
            label="Exact tokens 24h"
            value={formatNumber(usage24h.exact.totalTokens)}
            hint={`${formatNumber(usage24h.exact.requests)} exact requests`}
          />
          <StatCard
            label="Legacy tokens 24h"
            value={formatNumber(usage24h.estimatedLegacy.totalTokens)}
            hint={`${formatNumber(usage24h.estimatedLegacy.requests)} estimated messages`}
          />
          <StatCard
            label="Spend 30d"
            value={formatUsd(usage30d.combined.spendUsd)}
            hint={`${formatNumber(usage30d.combined.totalTokens)} total tokens`}
          />
          <StatCard
            label="Exact coverage"
            value={formatPct(data?.coverage.telemetryCoverage30d.coveragePct)}
            hint={`${formatNumber(data?.coverage.telemetryCoverage30d.withExactUsage)} exact / ${formatNumber(data?.coverage.telemetryCoverage30d.assistantMessages)} assistant messages`}
          />
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-2xl border border-[#edf0f5] bg-[#fbfcff] p-5">
            <h4 className="m-0 text-base font-semibold text-[#111827]">Token trend</h4>
            <p className="m-0 mt-1 text-xs text-[#98a2b3]">Exact vs legacy token volume over the last 30 days</p>
            <div className="mt-4 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#cbd5e1" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" />
                  <Tooltip />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="Exact" stroke="#f97316" fill="#fed7aa" />
                  <Area type="monotone" dataKey="Legacy" stroke="#64748b" fill="#e2e8f0" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-4">
            <WindowTable
              usage={data?.usage.windows ?? { "24h": emptyUsageWindow(), "7d": emptyUsageWindow(), "30d": emptyUsageWindow() }}
              quality={data?.quality.windows ?? { "24h": emptyQualityWindow(), "7d": emptyQualityWindow(), "30d": emptyQualityWindow() }}
            />
          </div>
        </div>

        <div className="mt-5">
          <h4 className="mb-3 mt-0 text-base font-semibold text-[#111827]">Model breakdown</h4>
          <ModelTable rows={data?.usage.models30d ?? []} />
        </div>
      </section>

      <section className="rounded-[30px] border border-[#e8eaf1] bg-white px-5 py-6 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.65)] md:px-7">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="m-0 text-[1.35rem] font-bold text-[#111827]">Quality snapshot</h3>
          <span className="text-sm text-[#98a2b3]">30d focus</span>
        </div>

        <div className="grid gap-3 lg:grid-cols-4">
          <StatCard
            label="Average risk"
            value={quality30d.avgHallScore.toFixed(3)}
            hint={`p95 ${quality30d.p95HallScore.toFixed(3)}`}
          />
          <StatCard
            label="Judged coverage"
            value={formatPct(data?.coverage.judgeCoverage30d.coveragePct)}
            hint={`${formatNumber(data?.coverage.judgeCoverage30d.judged)} judged answers`}
          />
          <StatCard
            label="Needs review"
            value={formatNumber(quality30d.highRiskCount)}
            hint="answers with score >= 0.85"
          />
          <StatCard
            label="Latest high score"
            value={latestRisk ? latestRisk.hallScore.toFixed(3) : "n/a"}
            hint={latestRisk ? "single answer; chart shows daily aggregates" : "no recent review-worthy answer"}
          />
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_0.8fr]">
          <div className="rounded-2xl border border-[#edf0f5] bg-[#fbfcff] p-5">
            <h4 className="m-0 text-base font-semibold text-[#111827]">Support-risk trend</h4>
            <p className="m-0 mt-1 text-xs text-[#98a2b3]">Average, p95, and daily max support-risk score</p>
            <div className="mt-4 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={qualityTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#cbd5e1" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" domain={[0, 1]} />
                  <Tooltip />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="Average" stroke="#f97316" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="P95" stroke="#ef4444" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="Max" stroke="#0f766e" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-[#edf0f5] bg-[#fffaf5] p-5">
            <h4 className="m-0 text-base font-semibold text-[#111827]">Interpretation and common reasons</h4>
            <div className="mt-4 space-y-2 text-sm leading-6 text-[#475467]">
              <p className="m-0">This is a support-risk score, not a truth score.</p>
              <p className="m-0">Higher values mean the answer relies more on weak or missing support in retrieved context.</p>
              <p className="m-0">A score like 0.8 can still be a strict grounding warning, not necessarily a true hallucination.</p>
              <p className="m-0">Legacy traffic is estimated from stored prompts and snippets, so those totals are directional.</p>
            </div>
            <div className="mt-4 space-y-2">
              {(data?.quality.reasonBreakdown30d ?? []).slice(0, 4).map((item, index) => (
                <div
                  key={item.reason}
                  className="rounded-2xl border border-[#fde68a] bg-[#fffbeb] px-3 py-3 text-sm leading-6 text-[#92400e]"
                >
                  <strong className="mr-2">{index + 1}.</strong>
                  <span className="break-words">{trimReason(item.reason)}</span>
                  <span className="ml-2 whitespace-nowrap text-[#b45309]">× {item.count}</span>
                </div>
              ))}
              {(data?.quality.reasonBreakdown30d ?? []).length === 0 ? (
                <span className="text-sm text-[#98a2b3]">No judge reasons yet.</span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-[#edf0f5] bg-white">
          <table className="w-full min-w-[940px] border-collapse text-sm">
            <thead className="bg-[#fafbfe]">
              <tr className="border-b border-[#eef1f5]">
                <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">Model</th>
                <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">Score</th>
                <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">Reason</th>
                <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">Feedback</th>
                <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">Excerpt</th>
              </tr>
            </thead>
            <tbody>
              {(data?.quality.riskyAnswers ?? []).slice(0, 8).map((item) => (
                <tr key={item.messageId} className="border-b border-[#eef1f5] align-top text-[#1f2937] hover:bg-[#fafbff]">
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(item.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{item.model}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{item.hallScore.toFixed(3)}</td>
                  <td className="max-w-[260px] break-words px-4 py-3">{item.hallReason}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{item.feedbackRating ?? "-"}</td>
                  <td className="max-w-[420px] break-words px-4 py-3">{item.answerExcerpt}</td>
                </tr>
              ))}
              {(data?.quality.riskyAnswers ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-[#98a2b3]">
                    No review-worthy answers found in the last 30 days.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
