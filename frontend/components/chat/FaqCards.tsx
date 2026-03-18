"use client";

import { useEffect, useState } from "react";

import { getCachedFaqItems, loadFaqItems, type FaqItem } from "@/lib/chatSuggestionsCache";
import { useAppTranslation } from "@/lib/i18n/I18nProvider";

export default function FaqCards({
  onPick,
  layout = "grid"
}: {
  onPick: (item: FaqItem) => void;
  layout?: "row" | "grid";
}) {
  const { t } = useAppTranslation();
  const [items, setItems] = useState<FaqItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = getCachedFaqItems();
    if (cached) {
      setItems(cached);
      setLoading(false);
    }

    async function load() {
      setError(null);
      try {
        const freshItems = await loadFaqItems({ force: !cached });
        setItems(freshItems);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : t("chat.faq.loadFailed"));
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (items.length === 0) {
    return <p className="text-sm text-slate-400">{t("chat.faq.empty")}</p>;
  }

  const containerClass =
    layout === "grid" ? "grid gap-4 sm:grid-cols-2" : "flex gap-3 overflow-x-auto pb-1";
  const buttonClass =
    layout === "grid"
      ? "w-full rounded-2xl border border-border bg-card px-5 py-4 text-center text-sm font-semibold text-slate-700 shadow-[0_12px_26px_rgba(15,23,42,0.08)] transition hover:border-[#e58b3a] hover:text-slate-900"
      : "whitespace-nowrap rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition hover:border-slate-300 hover:text-slate-900";

  if (loading) {
    return (
      <div className={containerClass}>
        {Array.from({ length: layout === "grid" ? 4 : 3 }).map((_, index) => (
          <div
            key={`faq-skeleton-${index}`}
            className={
              layout === "grid"
                ? "h-[56px] w-full animate-pulse rounded-2xl border border-border bg-white/70"
                : "h-[40px] w-[180px] shrink-0 animate-pulse rounded-full border border-border bg-white/70"
            }
          />
        ))}
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          title={item.question}
          onClick={() => onPick(item)}
          className={buttonClass}
        >
          {item.question}
        </button>
      ))}
    </div>
  );
}
