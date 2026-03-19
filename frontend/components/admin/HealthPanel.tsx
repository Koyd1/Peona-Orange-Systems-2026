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
import { useAppTranslation } from "@/lib/i18n/I18nProvider";

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
  requests: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  spendUsd: number;
  avgLatencyMs?: number | null;
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
      exactSpendUsd: number;
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
  };
};

const POLL_MS = 30000;

type BadgeLabels = {
  ok: string;
  warn: string;
  error: string;
  unavailable: string;
};

function asBadge(
  status: HealthPayload["status"] | "ok" | "warn" | "error",
  labels: BadgeLabels
) {
  if (status === "ok") return { text: labels.ok, color: "#166534", bg: "#dcfce7" };
  if (status === "warn") return { text: labels.warn, color: "#92400e", bg: "#fef3c7" };
  if (status === "unavailable") return { text: labels.unavailable, color: "#475467", bg: "#f2f4f7" };
  return { text: labels.error, color: "#991b1b", bg: "#fee2e2" };
}

function formatNumber(value: number | null | undefined, naLabel: string) {
  if (value === null || value === undefined || Number.isNaN(value)) return naLabel;
  return new Intl.NumberFormat("en-US").format(value);
}

function formatUsd(value: number | null | undefined, naLabel: string) {
  if (value === null || value === undefined || Number.isNaN(value)) return naLabel;
  return `$${value.toFixed(value >= 1 ? 2 : 4)}`;
}

function formatPct(value: number | null | undefined, naLabel: string) {
  if (value === null || value === undefined || Number.isNaN(value)) return naLabel;
  return `${value.toFixed(1)}%`;
}

function emptyUsageWindow(): UsageWindow {
  return {
    requests: 0,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    spendUsd: 0,
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
  statusLabel,
  latencyLabel,
  extra,
  detail,
}: {
  title: string;
  statusLabel: string;
  latencyLabel: string;
  extra?: string | null;
  detail?: string | null;
}) {
  return (
    <article className="rounded-2xl border border-[#e9edf5] bg-[#fbfcff] p-4">
      <h4 className="m-0 text-sm font-semibold uppercase tracking-[0.06em] text-[#98a2b3]">{title}</h4>
      <p className="mt-2 text-lg font-bold text-[#111827]">{statusLabel}</p>
      <p className="m-0 text-sm text-[#667085]">{latencyLabel}</p>
      {extra ? <p className="m-0 mt-1 text-sm text-[#667085]">{extra}</p> : null}
      {detail ? <p className="m-0 mt-1 text-sm text-[#b54708]">{detail}</p> : null}
    </article>
  );
}

function WindowTable({
  usage,
  quality,
  labels,
  naLabel,
}: {
  usage: Record<"24h" | "7d" | "30d", UsageWindow>;
  quality: Record<"24h" | "7d" | "30d", QualityWindow>;
  labels: {
    window: string;
    tokens: string;
    avgRisk: string;
    judged: string;
    needsReview: string;
  };
  naLabel: string;
}) {
  const rows: Array<"24h" | "7d" | "30d"> = ["24h", "7d", "30d"];

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#edf0f5] bg-white">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead className="bg-[#fafbfe]">
          <tr className="border-b border-[#eef1f5]">
            <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">{labels.window}</th>
            <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">{labels.tokens}</th>
            <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">{labels.avgRisk}</th>
            <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">{labels.judged}</th>
            <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">{labels.needsReview}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((label) => (
            <tr key={label} className="border-b border-[#eef1f5] text-[#1f2937]">
              <td className="px-4 py-3 font-medium">{label}</td>
              <td className="px-4 py-3">{formatNumber(usage[label].totalTokens, naLabel)}</td>
              <td className="px-4 py-3">{quality[label].avgHallScore.toFixed(3)}</td>
              <td className="px-4 py-3">{formatNumber(quality[label].judgedSamples, naLabel)}</td>
              <td className="px-4 py-3">{formatNumber(quality[label].highRiskCount, naLabel)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ModelTable({
  rows,
  labels,
  naLabel,
  formatLatency,
}: {
  rows: UsageRow[];
  labels: {
    headers: {
      model: string;
      operation: string;
      tokens: string;
      spend: string;
      latency: string;
    };
    pricingGap: string;
    noData: string;
  };
  naLabel: string;
  formatLatency: (value: number) => string;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#edf0f5] bg-white">
      <table className="w-full min-w-[680px] border-collapse text-sm">
        <thead className="bg-[#fafbfe]">
          <tr className="border-b border-[#eef1f5]">
            <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">{labels.headers.model}</th>
            <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">{labels.headers.operation}</th>
            <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">{labels.headers.tokens}</th>
            <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">{labels.headers.spend}</th>
            <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">{labels.headers.latency}</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 6).map((row) => (
            <tr key={`${row.model}-${row.operation}`} className="border-b border-[#eef1f5] text-[#1f2937]">
              <td className="px-4 py-3">{row.model}</td>
              <td className="px-4 py-3">{row.operation}</td>
              <td className="px-4 py-3">
                {formatNumber(row.totalTokens, naLabel)}
              </td>
              <td className="px-4 py-3">
                {formatUsd(row.costTotalUsd, naLabel)}
                {row.missingPricing ? (
                  <span className="ml-2 text-xs text-[#b54708]">{labels.pricingGap}</span>
                ) : null}
              </td>
              <td className="px-4 py-3">{row.avgLatencyMs ? formatLatency(row.avgLatencyMs) : naLabel}</td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-sm text-[#98a2b3]">
                {labels.noData}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

export function HealthPanel() {
  const { t } = useAppTranslation();
  const [data, setData] = useState<HealthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch("/api/health", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(t("admin.health.errors.loadFailed"));
        }
        const payload = (await response.json()) as HealthPayload;
        if (!cancelled) {
          setData(payload);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setData(null);
          setError(
            loadError instanceof Error
              ? loadError.message
              : t("admin.health.errors.loadGeneric")
          );
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

  const naLabel = t("admin.health.common.na");
  const badge = useMemo(
    () =>
      asBadge(data?.status ?? "unavailable", {
        ok: t("admin.health.badge.ok"),
        warn: t("admin.health.badge.warn"),
        error: t("admin.health.badge.error"),
        unavailable: t("admin.health.badge.unavailable"),
      }),
    [data?.status, t]
  );

  const usage24h = data?.usage.windows["24h"] ?? emptyUsageWindow();
  const usage30d = data?.usage.windows["30d"] ?? emptyUsageWindow();
  const quality30d = data?.quality.windows["30d"] ?? emptyQualityWindow();
  const latestRisk = data?.quality.riskyAnswers?.[0] ?? null;
  const exactEmpty = (data?.coverage.telemetryCoverage30d.withExactUsage ?? 0) === 0;
  const tokenSeriesLabel = t("admin.health.usage.tokenTrend.series.tokens");
  const avgSeriesLabel = t("admin.health.quality.trend.series.average");
  const p95SeriesLabel = t("admin.health.quality.trend.series.p95");
  const trendData = (data?.usage.trends30d ?? []).map((item) => ({
    day: item.day.slice(5),
    [tokenSeriesLabel]: item.exactTokens,
  }));
  const qualityTrendData = (data?.quality.trends30d ?? []).map((item) => ({
    day: item.day.slice(5),
    [avgSeriesLabel]: item.avgHallScore,
    [p95SeriesLabel]: item.p95HallScore,
  }));
  const updatedLabel = t("admin.health.panel.updated", {
    value: data?.timestamp ? new Date(data.timestamp).toLocaleString() : naLabel,
  });
  const serviceOkLabel = t("admin.health.services.statusOk");
  const serviceFailLabel = t("admin.health.services.statusFail");

  return (
    <section className="space-y-7">
      <section className="rounded-[30px] border border-[#e8eaf1] bg-white px-5 py-6 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.65)] md:px-7">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="m-0 text-[1.7rem] font-bold tracking-[-0.02em] text-[#111827]">
              {t("admin.health.panel.title")}
            </h2>
            <p className="mt-2 text-sm text-[#667085]">
              {t("admin.health.panel.subtitle")}
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
            {t("admin.health.alerts.exactTelemetryEmpty")}
          </div>
        ) : null}

        {data?.coverage.missingPricingModels.length ? (
          <div className="mb-4 rounded-2xl border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-sm text-[#92400e]">
            {t("admin.health.alerts.missingPricing", {
              models: data.coverage.missingPricingModels.join(", "),
            })}
          </div>
        ) : null}

        <small className="block text-sm text-[#98a2b3]">{updatedLabel}</small>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <ServiceCard
          title={t("admin.health.services.openai")}
          statusLabel={data?.services.openai?.ok ? serviceOkLabel : serviceFailLabel}
          latencyLabel={t("admin.health.services.latency", {
            value: data?.services.openai?.latencyMs ?? naLabel,
          })}
          extra={
            data?.services.openai?.model
              ? t("admin.health.services.model", { value: data.services.openai.model })
              : null
          }
          detail={data?.services.openai?.detail ?? null}
        />
        <ServiceCard
          title={t("admin.health.services.redis")}
          statusLabel={data?.services.redis?.ok ? serviceOkLabel : serviceFailLabel}
          latencyLabel={t("admin.health.services.latency", {
            value: data?.services.redis?.latencyMs ?? naLabel,
          })}
          detail={data?.services.redis?.detail ?? null}
        />
        <ServiceCard
          title={t("admin.health.services.database")}
          statusLabel={data?.services.database?.ok ? serviceOkLabel : serviceFailLabel}
          latencyLabel={t("admin.health.services.latency", {
            value: data?.services.database?.latencyMs ?? naLabel,
          })}
          extra={t("admin.health.services.chunksMessages", {
            chunks: formatNumber(data?.services.database.chunkCount, naLabel),
            messages: formatNumber(data?.services.database.messageCount, naLabel),
          })}
          detail={data?.services.database?.detail ?? null}
        />
      </section>

      <section className="rounded-[30px] border border-[#e8eaf1] bg-white px-5 py-6 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.65)] md:px-7">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="m-0 text-[1.35rem] font-bold text-[#111827]">
            {t("admin.health.usage.snapshotTitle")}
          </h3>
          <span className="text-sm text-[#98a2b3]">
            {t("admin.health.usage.snapshotSubtitle")}
          </span>
        </div>

        <div className="grid gap-3 lg:grid-cols-4">
          <StatCard
            label={t("admin.health.usage.stats.tokens24h")}
            value={formatNumber(usage24h.totalTokens, naLabel)}
            hint={t("admin.health.usage.stats.requests", {
              count: formatNumber(usage24h.requests, naLabel),
            })}
          />
          <StatCard
            label={t("admin.health.usage.stats.spend30d")}
            value={formatUsd(usage30d.spendUsd, naLabel)}
            hint={t("admin.health.usage.stats.totalTokens", {
              count: formatNumber(usage30d.totalTokens, naLabel),
            })}
          />
          <StatCard
            label={t("admin.health.usage.stats.coverage")}
            value={formatPct(data?.coverage.telemetryCoverage30d.coveragePct, naLabel)}
            hint={t("admin.health.usage.stats.messages", {
              withExact: formatNumber(data?.coverage.telemetryCoverage30d.withExactUsage, naLabel),
              total: formatNumber(data?.coverage.telemetryCoverage30d.assistantMessages, naLabel),
            })}
          />
          <StatCard
            label={t("admin.health.usage.stats.judged")}
            value={formatPct(data?.coverage.judgeCoverage30d.coveragePct, naLabel)}
            hint={t("admin.health.usage.stats.judgedAnswers", {
              count: formatNumber(data?.coverage.judgeCoverage30d.judged, naLabel),
            })}
          />
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-2xl border border-[#edf0f5] bg-[#fbfcff] p-5">
            <h4 className="m-0 text-base font-semibold text-[#111827]">
              {t("admin.health.usage.tokenTrend.title")}
            </h4>
            <p className="m-0 mt-1 text-xs text-[#98a2b3]">
              {t("admin.health.usage.tokenTrend.subtitle")}
            </p>
            <div className="mt-4 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#cbd5e1" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" />
                  <Tooltip />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey={tokenSeriesLabel} stroke="#f97316" fill="#fed7aa" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-4">
            <WindowTable
              usage={data?.usage.windows ?? { "24h": emptyUsageWindow(), "7d": emptyUsageWindow(), "30d": emptyUsageWindow() }}
              quality={data?.quality.windows ?? { "24h": emptyQualityWindow(), "7d": emptyQualityWindow(), "30d": emptyQualityWindow() }}
              labels={{
                window: t("admin.health.usage.windowTable.headers.window"),
                tokens: t("admin.health.usage.windowTable.headers.tokens"),
                avgRisk: t("admin.health.usage.windowTable.headers.avgRisk"),
                judged: t("admin.health.usage.windowTable.headers.judged"),
                needsReview: t("admin.health.usage.windowTable.headers.needsReview"),
              }}
              naLabel={naLabel}
            />
          </div>
        </div>

        <div className="mt-5">
          <h4 className="mb-3 mt-0 text-base font-semibold text-[#111827]">
            {t("admin.health.usage.modelBreakdown.title")}
          </h4>
          <ModelTable
            rows={data?.usage.models30d ?? []}
            labels={{
              headers: {
                model: t("admin.health.usage.modelBreakdown.table.headers.model"),
                operation: t("admin.health.usage.modelBreakdown.table.headers.operation"),
                tokens: t("admin.health.usage.modelBreakdown.table.headers.tokens"),
                spend: t("admin.health.usage.modelBreakdown.table.headers.spend"),
                latency: t("admin.health.usage.modelBreakdown.table.headers.latency"),
              },
              pricingGap: t("admin.health.usage.modelBreakdown.table.pricingGap"),
              noData: t("admin.health.usage.modelBreakdown.table.noData"),
            }}
            naLabel={naLabel}
            formatLatency={(value) => t("admin.health.common.msValue", { value })}
          />
        </div>
      </section>

      <section className="rounded-[30px] border border-[#e8eaf1] bg-white px-5 py-6 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.65)] md:px-7">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="m-0 text-[1.35rem] font-bold text-[#111827]">
            {t("admin.health.quality.snapshotTitle")}
          </h3>
          <span className="text-sm text-[#98a2b3]">
            {t("admin.health.quality.snapshotSubtitle")}
          </span>
        </div>

        <div className="grid gap-3 lg:grid-cols-4">
          <StatCard
            label={t("admin.health.quality.stats.averageRisk")}
            value={quality30d.avgHallScore.toFixed(3)}
            hint={t("admin.health.quality.stats.p95Hint", {
              value: quality30d.p95HallScore.toFixed(3),
            })}
          />
          <StatCard
            label={t("admin.health.quality.stats.judgedCoverage")}
            value={formatPct(data?.coverage.judgeCoverage30d.coveragePct, naLabel)}
            hint={t("admin.health.quality.stats.judgedAnswersHint", {
              count: formatNumber(data?.coverage.judgeCoverage30d.judged, naLabel),
            })}
          />
          <StatCard
            label={t("admin.health.quality.stats.needsReview")}
            value={formatNumber(quality30d.highRiskCount, naLabel)}
            hint={t("admin.health.quality.stats.needsReviewHint")}
          />
          <StatCard
            label={t("admin.health.quality.stats.latestHighScore")}
            value={latestRisk ? latestRisk.hallScore.toFixed(3) : naLabel}
            hint={
              latestRisk
                ? t("admin.health.quality.stats.latestHint")
                : t("admin.health.quality.stats.latestEmpty")
            }
          />
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_0.8fr]">
          <div className="rounded-2xl border border-[#edf0f5] bg-[#fbfcff] p-5">
            <h4 className="m-0 text-base font-semibold text-[#111827]">
              {t("admin.health.quality.trend.title")}
            </h4>
            <p className="m-0 mt-1 text-xs text-[#98a2b3]">
              {t("admin.health.quality.trend.subtitle")}
            </p>
            <div className="mt-4 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={qualityTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#cbd5e1" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" domain={[0, 1]} />
                  <Tooltip />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey={avgSeriesLabel} stroke="#f97316" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey={p95SeriesLabel} stroke="#ef4444" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-[#edf0f5] bg-[#fffaf5] p-5">
            <h4 className="m-0 text-base font-semibold text-[#111827]">
              {t("admin.health.quality.interpretation.title")}
            </h4>
            <div className="mt-4 space-y-2 text-sm leading-6 text-[#475467]">
              <p className="m-0">{t("admin.health.quality.interpretation.point1")}</p>
              <p className="m-0">{t("admin.health.quality.interpretation.point2")}</p>
              <p className="m-0">{t("admin.health.quality.interpretation.point3")}</p>
            </div>
            <div className="mt-4 space-y-2">
              {(data?.quality.reasonBreakdown30d ?? []).slice(0, 4).map((item, index) => (
                <div
                  key={item.reason}
                  className="rounded-2xl border border-[#fde68a] bg-[#fffbeb] px-3 py-3 text-sm leading-6 text-[#92400e]"
                >
                  <strong className="mr-2">{index + 1}.</strong>
                  <span className="break-words">{trimReason(item.reason)}</span>
                  <span className="ml-2 whitespace-nowrap text-[#b45309]">
                    {t("admin.health.quality.reasonCount", { count: item.count })}
                  </span>
                </div>
              ))}
              {(data?.quality.reasonBreakdown30d ?? []).length === 0 ? (
                <span className="text-sm text-[#98a2b3]">
                  {t("admin.health.quality.reasonsEmpty")}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-[#edf0f5] bg-white">
          <table className="w-full min-w-[940px] border-collapse text-sm">
            <thead className="bg-[#fafbfe]">
              <tr className="border-b border-[#eef1f5]">
                <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">
                  {t("admin.health.quality.riskyTable.headers.date")}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">
                  {t("admin.health.quality.riskyTable.headers.model")}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">
                  {t("admin.health.quality.riskyTable.headers.score")}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">
                  {t("admin.health.quality.riskyTable.headers.reason")}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">
                  {t("admin.health.quality.riskyTable.headers.feedback")}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">
                  {t("admin.health.quality.riskyTable.headers.excerpt")}
                </th>
              </tr>
            </thead>
            <tbody>
              {(data?.quality.riskyAnswers ?? []).slice(0, 8).map((item) => (
                <tr key={item.messageId} className="border-b border-[#eef1f5] align-top text-[#1f2937] hover:bg-[#fafbff]">
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(item.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{item.model}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{item.hallScore.toFixed(3)}</td>
                  <td className="max-w-[260px] break-words px-4 py-3">{item.hallReason}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{item.feedbackRating ?? naLabel}</td>
                  <td className="max-w-[420px] break-words px-4 py-3">{item.answerExcerpt}</td>
                </tr>
              ))}
              {(data?.quality.riskyAnswers ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-[#98a2b3]">
                    {t("admin.health.quality.riskyTable.empty")}
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
