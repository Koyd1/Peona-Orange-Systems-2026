"use client";

import { useEffect, useState } from "react";

import FeedbackChart from "@/components/admin/FeedbackChart";
import { Button, buttonVariants } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

type Summary = {
  total: number;
  positive: number;
  negative: number;
  positiveRate: number;
};

type Point = {
  day: string;
  total: number;
  positive: number;
  negative: number;
};

type NegativeRow = {
  id: string;
  messageId: string;
  comment: string | null;
  createdAt: string;
  userEmail: string;
  sessionId: string;
  messageContent: string;
};

export default function AdminFeedbackPage() {
  const [summary, setSummary] = useState<Summary>({
    total: 0,
    positive: 0,
    negative: 0,
    positiveRate: 0
  });
  const [series, setSeries] = useState<Point[]>([]);
  const [negative, setNegative] = useState<NegativeRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, timeseriesRes, negativeRes] = await Promise.all([
        fetch("/api/admin/feedback/summary", { cache: "no-store" }),
        fetch("/api/admin/feedback/timeseries", { cache: "no-store" }),
        fetch("/api/admin/feedback/negative", { cache: "no-store" })
      ]);

      if (!summaryRes.ok || !timeseriesRes.ok || !negativeRes.ok) {
        throw new Error("Failed to load feedback analytics");
      }

      const summaryData = (await summaryRes.json()) as Summary;
      const seriesData = (await timeseriesRes.json()) as { items: Point[] };
      const negativeData = (await negativeRes.json()) as { items: NegativeRow[] };

      setSummary(summaryData);
      setSeries(seriesData.items);
      setNegative(negativeData.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Load error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-7">
      <section className="rounded-[30px] border border-[#e8eaf1] bg-white px-7 py-7 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.65)] md:px-10 md:py-9">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="max-w-[620px]">
            <h1 className="m-0 text-[2rem] font-bold tracking-[-0.02em] text-[#111827] md:text-[2.35rem]">
              Feedback
            </h1>
            <p className="mt-3 text-base leading-relaxed text-[#6b7280]">
              Monitorizezi satisfacția utilizatorilor prin indicatori zilnici și feedback negativ.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              size="sm"
              className="h-11 px-5 text-sm"
              onClick={() => void load()}
              disabled={loading}
            >
              {loading ? (
                <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-[#cbd5e1] border-t-[#475467]" />
              ) : (
                <span className="text-base leading-none">↻</span>
              )}
              Refresh
            </Button>
            <a
              href="/api/admin/feedback/export"
              target="_blank"
              rel="noreferrer"
              className={`${buttonVariants({
                variant: "outline",
                size: "sm"
              })} h-11 px-5 text-sm`}
            >
              <span className="text-base leading-none">↓</span>
              Download CSV
            </a>
          </div>
        </div>
        {error ? <Alert variant="error" className="mt-6">{error}</Alert> : null}
      </section>

      <FeedbackChart summary={summary} series={series} />

      <section className="rounded-[30px] border border-[#e8eaf1] bg-white px-5 py-6 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.65)] md:px-7">
        <h2 className="m-0 text-[1.7rem] font-bold tracking-[-0.02em] text-[#111827]">
          Negative feedback
        </h2>
        <p className="mt-2 text-sm text-[#6b7280]">
          Mesajele care au primit evaluări negative în conversațiile recente.
        </p>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-[#edf0f5] bg-white">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead className="bg-[#fafbfe]">
              <tr className="border-b border-[#eef1f5]">
                <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">User</th>
                <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">Comment</th>
                <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">Message</th>
                <th className="px-4 py-3 text-left font-semibold text-[#98a2b3]">Session</th>
              </tr>
            </thead>
            <tbody>
            {negative.map((row) => (
              <tr key={row.id} className="border-b border-[#eef1f5] align-top text-[#1f2937] hover:bg-[#fafbff]">
                <td className="px-4 py-3 whitespace-nowrap">{new Date(row.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 whitespace-nowrap">{row.userEmail}</td>
                <td className="max-w-[260px] px-4 py-3">{row.comment || "-"}</td>
                <td className="max-w-[360px] px-4 py-3">{row.messageContent}</td>
                <td className="px-4 py-3 text-xs text-[#98a2b3]">{row.sessionId}</td>
              </tr>
            ))}
            {negative.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                    <h3 className="m-0 text-lg font-semibold text-[#344054]">Nu există feedback negativ</h3>
                    <p className="mt-2 max-w-[360px] text-sm text-[#667085]">
                      Utilizatorii au oferit până acum feedback pozitiv.
                    </p>
                  </div>
                </td>
              </tr>
            ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
