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
        <div className="section-header">
          <div>
            <h1>Feedback dashboard</h1>
            <p className="section-header-sub">Агрегаты, динамика и негативные отзывы пользователей.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn btn-sm btn-secondary" onClick={() => void load()} disabled={loading}>
              Refresh
            </button>
            <a href="/api/admin/feedback/export" className="btn btn-sm btn-outline-orange" target="_blank" rel="noreferrer">
              Download CSV
            </a>
          </div>
        </div>
        {error ? <div className="alert alert-error">{error}</div> : null}
      </div>

      <FeedbackChart summary={summary} series={series} />

      <div className="card">
        <div className="section-header">
          <h2>Negative feedback</h2>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>User</th>
                <th>Comment</th>
                <th>Message</th>
                <th>Session</th>
              </tr>
            </thead>
            <tbody>
              {negative.map((row) => (
                <tr key={row.id}>
                  <td>{new Date(row.createdAt).toLocaleString()}</td>
                  <td>{row.userEmail}</td>
                  <td>{row.comment || "-"}</td>
                  <td style={{ maxWidth: 360 }}>{row.messageContent}</td>
                  <td className="text-xs text-muted">{row.sessionId}</td>
                </tr>
              ))}
              {negative.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <div className="empty-state-icon">👍</div>
                      <h3>Нет негативных отзывов</h3>
                      <p>Все пользователи довольны!</p>
                    </div>
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
