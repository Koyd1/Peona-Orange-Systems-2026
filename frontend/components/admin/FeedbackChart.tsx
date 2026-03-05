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
    <div className="card" style={{ marginBottom: 16 }}>
      <h2 style={{ marginTop: 0 }}>Feedback analytics</h2>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <div className="card" style={{ padding: 12, minWidth: 120 }}>
          <div style={{ fontSize: 12, color: "#475467" }}>Total</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{summary.total}</div>
        </div>
        <div className="card" style={{ padding: 12, minWidth: 120 }}>
          <div style={{ fontSize: 12, color: "#475467" }}>Positive</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#027a48" }}>{summary.positive}</div>
        </div>
        <div className="card" style={{ padding: 12, minWidth: 120 }}>
          <div style={{ fontSize: 12, color: "#475467" }}>Negative</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#b42318" }}>{summary.negative}</div>
        </div>
        <div className="card" style={{ padding: 12, minWidth: 120 }}>
          <div style={{ fontSize: 12, color: "#475467" }}>Positive rate</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{summary.positiveRate}%</div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {series.length === 0 ? <p>Нет данных для графика.</p> : null}
        {series.map((point) => (
          <div key={point.day}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span>{point.day}</span>
              <span>
                {point.positive} / {point.negative} / {point.total}
              </span>
            </div>
            <div style={{ display: "flex", height: 10, borderRadius: 999, overflow: "hidden" }}>
              <div
                style={{
                  width: `${(point.positive / maxTotal) * 100}%`,
                  background: "#12b76a"
                }}
              />
              <div
                style={{
                  width: `${(point.negative / maxTotal) * 100}%`,
                  background: "#f04438"
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
