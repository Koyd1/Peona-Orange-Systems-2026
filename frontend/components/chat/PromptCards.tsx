"use client";

import { useEffect, useState } from "react";

type PromptTemplate = {
  id: string;
  title: string;
  content: string;
  category: string | null;
  order: number;
};

export default function PromptCards({
  onPick
}: {
  onPick: (content: string) => void;
}) {
  const [items, setItems] = useState<PromptTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setError(null);
      try {
        const response = await fetch("/api/prompts", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load prompt cards");
        }

        const payload = (await response.json()) as { items: PromptTemplate[] };
        setItems(payload.items);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load prompt cards");
      }
    }

    void load();
  }, []);

  if (error) {
    return <p style={{ color: "#b42318", marginTop: 0 }}>{error}</p>;
  }

  if (items.length === 0) {
    return <p style={{ marginTop: 0 }}>Нет активных prompt templates.</p>;
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        overflowX: "auto",
        paddingBottom: 4,
        marginBottom: 10
      }}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          title={item.content}
          onClick={() => onPick(item.content)}
          style={{
            border: "1px solid #d0d5dd",
            borderRadius: 999,
            background: "#fff",
            padding: "6px 10px",
            whiteSpace: "nowrap"
          }}
        >
          {item.title}
        </button>
      ))}
    </div>
  );
}
