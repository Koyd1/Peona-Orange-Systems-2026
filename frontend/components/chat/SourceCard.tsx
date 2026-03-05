"use client";

export type ChatSource = {
  fileId?: string;
  filename?: string;
  similarity?: number;
  snippet?: string;
};

export default function SourceCard({ source }: { source: ChatSource }) {
  return (
    <div
      style={{
        border: "1px solid #d0d5dd",
        borderRadius: 8,
        padding: 8,
        marginTop: 8,
        background: "#f8fafc"
      }}
    >
      <div style={{ fontWeight: 600 }}>{source.filename ?? "unknown"}</div>
      {typeof source.similarity === "number" ? (
        <div style={{ color: "#475467", fontSize: 12 }}>
          similarity: {source.similarity.toFixed(3)}
        </div>
      ) : null}
      {source.snippet ? <div style={{ marginTop: 4, fontSize: 13 }}>{source.snippet}</div> : null}
    </div>
  );
}
