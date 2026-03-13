"use client";

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

export default function FeedbackChart({
  summary,
  series
}: {
  summary: Summary;
  series: Point[];
}) {
  const maxTotal = Math.max(1, ...series.map((item) => item.total));

  return (
    <section className="rounded-[30px] border border-[#e8eaf1] bg-white px-5 py-6 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.65)] md:px-7">
      <h2 className="m-0 text-[1.7rem] font-bold tracking-[-0.02em] text-[#111827]">
        Feedback analytics
      </h2>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#e9edf5] bg-[#fbfcff] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#98a2b3]">Total</div>
          <div className="mt-2 text-2xl font-bold text-[#111827]">{summary.total}</div>
        </div>
        <div className="rounded-2xl border border-[#d9f5e5] bg-[#f1fdf6] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#0f8a4a]">Positive</div>
          <div className="mt-2 text-2xl font-bold text-[#027a48]">{summary.positive}</div>
        </div>
        <div className="rounded-2xl border border-[#fee4e2] bg-[#fff5f4] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#b42318]">Negative</div>
          <div className="mt-2 text-2xl font-bold text-[#b42318]">{summary.negative}</div>
        </div>
        <div className="rounded-2xl border border-[#e7edff] bg-[#f5f8ff] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4a63d9]">
            Positive rate
          </div>
          <div className="mt-2 text-2xl font-bold text-[#1d2939]">{summary.positiveRate}%</div>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {series.length === 0 ? (
          <p className="m-0 rounded-2xl border border-dashed border-[#d0d5dd] bg-[#fcfdff] px-4 py-10 text-center text-sm text-[#667085]">
            Nu există încă date pentru grafic.
          </p>
        ) : null}
        {series.map((point) => (
          <div key={point.day} className="rounded-2xl border border-[#edf0f5] bg-[#fbfcff] px-4 py-3">
            <div className="mb-2 flex items-center justify-between text-sm text-[#667085]">
              <span className="font-semibold text-[#344054]">{point.day}</span>
              <span className="font-medium">
                {point.positive} / {point.negative} / {point.total}
              </span>
            </div>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-[#eef2f7]">
              <div
                className="bg-[#12b76a]"
                style={{ width: `${(point.positive / maxTotal) * 100}%` }}
              />
              <div
                className="bg-[#f04438]"
                style={{ width: `${(point.negative / maxTotal) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
