"use client";

import { useEffect, useState } from "react";

import FeedbackChart from "@/components/admin/FeedbackChart";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

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
      <Card className="mb-4">
        <CardHeader>
          <div>
            <CardTitle className="text-2xl">Feedback dashboard</CardTitle>
            <CardDescription>Агрегаты, динамика и негативные отзывы пользователей.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading}>
              Refresh
            </Button>
            <a href="/api/admin/feedback/export" target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Download CSV
            </a>
          </div>
        </CardHeader>
        {error ? <Alert variant="error">{error}</Alert> : null}
      </Card>

      <FeedbackChart summary={summary} series={series} />

      <Card>
        <CardHeader>
          <CardTitle>Negative feedback</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Session</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {negative.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                <TableCell>{row.userEmail}</TableCell>
                <TableCell>{row.comment || "-"}</TableCell>
                <TableCell className="max-w-[360px]">{row.messageContent}</TableCell>
                <TableCell className="text-xs text-gray-400">{row.sessionId}</TableCell>
              </TableRow>
            ))}
            {negative.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="flex flex-col items-center justify-center text-center py-16 px-6 text-gray-400">
                    <div className="text-4xl mb-4 opacity-50">👍</div>
                    <h3 className="text-gray-500 mb-2 font-semibold">Нет негативных отзывов</h3>
                    <p className="max-w-[360px] text-sm">Все пользователи довольны!</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
