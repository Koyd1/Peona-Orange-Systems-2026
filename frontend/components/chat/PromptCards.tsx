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
  onPick,
  layout = "row"
}: {
  onPick: (content: string) => void;
  layout?: "row" | "grid";
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
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (items.length === 0) {
    return <p className="text-sm text-slate-400">Nu exista sabloane active.</p>;
  }

  const containerClass =
    layout === "grid" ? "grid gap-4 sm:grid-cols-2" : "flex gap-3 overflow-x-auto pb-1";
  const buttonClass =
    layout === "grid"
      ? "w-full rounded-2xl border border-border bg-card px-5 py-4 text-center text-sm font-semibold text-slate-700 shadow-[0_12px_26px_rgba(15,23,42,0.08)] transition hover:border-[#e58b3a] hover:text-slate-900"
      : "whitespace-nowrap rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition hover:border-slate-300 hover:text-slate-900";

  return (
    <div className={containerClass}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          title={item.content}
          onClick={() => onPick(item.content)}
          className={buttonClass}
        >
          {item.title}
        </button>
      ))}
    </div>
  );
}
