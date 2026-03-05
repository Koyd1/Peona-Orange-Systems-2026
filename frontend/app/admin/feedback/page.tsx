"use client";

import { useEffect, useState } from "react";

import FeedbackChart from "@/components/admin/FeedbackChart";

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
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <h1 style={{ marginTop: 0 }}>Feedback dashboard</h1>
        <p style={{ marginTop: 0 }}>Агрегаты, динамика и негативные отзывы пользователей.</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => void load()} disabled={loading}>
            Refresh
          </button>
          <a href="/api/admin/feedback/export" target="_blank" rel="noreferrer">
            Download CSV
          </a>
        </div>
        {error ? <p style={{ color: "#b42318" }}>{error}</p> : null}
      </div>

      <FeedbackChart summary={summary} series={series} />

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Negative feedback</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th align="left">Date</th>
                <th align="left">User</th>
                <th align="left">Comment</th>
                <th align="left">Message</th>
                <th align="left">Session</th>
              </tr>
            </thead>
            <tbody>
              {negative.map((row) => (
                <tr key={row.id} style={{ borderTop: "1px solid #e4e7ec" }}>
                  <td style={{ padding: "8px 0" }}>{new Date(row.createdAt).toLocaleString()}</td>
                  <td>{row.userEmail}</td>
                  <td>{row.comment || "-"}</td>
                  <td style={{ maxWidth: 360 }}>{row.messageContent}</td>
                  <td style={{ fontSize: 12 }}>{row.sessionId}</td>
                </tr>
              ))}
              {negative.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ paddingTop: 12 }}>
                    Нет негативных отзывов.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
