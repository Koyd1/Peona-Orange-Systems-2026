"use client";

import { useEffect, useMemo, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  order: number;
  isActive: boolean;
  updatedAt: string;
};

type Draft = {
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
};

function createEmptyDraft(order = 100): Draft {
  return {
    question: "",
    answer: "",
    category: "",
    order,
    isActive: true
  };
}

async function readFaqApiError(response: Response, fallback: string) {
  const payload = await response.json().catch(() => null);
  const message =
    (payload && typeof payload === "object" && "error" in payload && payload.error) ||
    (payload && typeof payload === "object" && "detail" in payload && payload.detail);

  if (typeof message === "string" && message.trim()) {
    if (message === "Invalid payload") {
      return "Datele introduse nu sunt valide. Verifică întrebarea, răspunsul, categoria și ordinea.";
    }
    return message;
  }

  const text = await response.text().catch(() => "");
  if (text.trim()) {
    return text;
  }

  return fallback;
}

export default function FaqEditor() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [draft, setDraft] = useState<Draft>(createEmptyDraft());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const sortedItems = useMemo(
    () =>
      [...items].sort((left, right) => {
        if (left.order !== right.order) {
          return left.order - right.order;
        }
        return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
      }),
    [items]
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/faq", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load FAQ items");
      const payload = (await response.json()) as { items: FaqItem[] };
      setItems(payload.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Load error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (target.closest("[data-faq-menu]")) {
        return;
      }
      setOpenMenuId(null);
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  async function createItem() {
    setBusyId("create");
    setError(null);
    try {
      const response = await fetch("/api/admin/faq", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft)
      });
      if (!response.ok) {
        throw new Error(await readFaqApiError(response, "Crearea FAQ-ului a eșuat."));
      }
      setDraft(createEmptyDraft());
      setIsCreateOpen(false);
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Crearea FAQ-ului a eșuat.");
    } finally {
      setBusyId(null);
    }
  }

  async function patchItem(id: string, patch: Partial<Draft>) {
    setBusyId(id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/faq/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch)
      });

      if (!response.ok) {
        throw new Error(await readFaqApiError(response, "Actualizarea FAQ-ului a eșuat."));
      }

      await load();
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : "Actualizarea FAQ-ului a eșuat."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function deleteItem(id: string) {
    const confirmed = window.confirm("Ștergi acest element FAQ?");
    if (!confirmed) return;

    setBusyId(id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/faq/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Delete failed");
      }

      await load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  async function editItem(item: FaqItem) {
    const question = window.prompt("Întrebare nouă", item.question);
    if (question === null) return;

    const answer = window.prompt("Răspuns nou", item.answer);
    if (answer === null) return;

    await patchItem(item.id, { question, answer });
  }

  function resetEditor() {
    setDraft(createEmptyDraft());
    setIsCreateOpen(false);
  }

  function toggleCreateEditor() {
    if (isCreateOpen) {
      resetEditor();
      return;
    }

    setDraft(createEmptyDraft());
    setIsCreateOpen(true);
  }

  function formatDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }
    return date.toLocaleDateString("sv-SE");
  }

  function subtitle(item: FaqItem) {
    if (item.category && item.category.trim().length > 0) {
      return `Categorie: ${item.category}`;
    }
    return "Întrebări frecvente pentru asistent";
  }

  return (
    <section className="space-y-6">
      <section className="w-full pt-3">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-[760px]">
            <h1 className="m-0 text-[2.25rem] font-bold tracking-[-0.02em] text-[#111827] md:text-[2.75rem]">
              FAQ
            </h1>
            <p className="mt-3 text-lg leading-relaxed text-[#6b7280]">
              Gestionarea întrebărilor frecvente pentru asistentul AI.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 xl:justify-end">
            {loading ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-[#eef2ff] px-3 py-1.5 text-sm text-[#4338ca]">
                <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-[#a5b4fc] border-t-[#4338ca]" />
                Actualizare...
              </span>
            ) : null}
            <Button
              type="button"
              size="md"
              className="h-11 px-6 text-base"
              onClick={toggleCreateEditor}
            >
              <span className="text-lg leading-none">+</span>
              {isCreateOpen ? "Ascunde formularul" : "Creare FAQ"}
            </Button>
          </div>
        </div>
        {error ? <Alert variant="error" className="mt-6 max-w-[760px]">{error}</Alert> : null}
      </section>

      {isCreateOpen ? (
        <section className="rounded-[24px] border border-[#eceff5] bg-white p-5 shadow-[0_20px_48px_-44px_rgba(15,23,42,0.85)] md:p-6">
          <h2 className="m-0 text-xl font-semibold text-[#101828]">Element FAQ nou</h2>
          <form
            className="mt-4 grid gap-3 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              await createItem();
            }}
          >
            <Input
              placeholder="Întrebare"
              value={draft.question}
              onChange={(event) => setDraft((prev) => ({ ...prev, question: event.target.value }))}
              className="bg-white md:col-span-2"
            />
            <Textarea
              placeholder="Răspuns"
              value={draft.answer}
              onChange={(event) => setDraft((prev) => ({ ...prev, answer: event.target.value }))}
              className="min-h-[110px] bg-white md:col-span-2"
            />
            <Input
              placeholder="Categorie"
              value={draft.category}
              onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value }))}
              className="bg-white"
            />
            <Input
              type="number"
              placeholder="Ordine"
              value={draft.order}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  order: Number.isNaN(Number(event.target.value))
                    ? prev.order
                    : Number(event.target.value)
                }))
              }
              className="bg-white"
            />
            <label className="inline-flex items-center gap-2 text-sm text-[#334155] md:col-span-2">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    isActive: event.target.checked
                  }))
                }
              />
              Activ
            </label>
            <div className="flex items-center gap-2 md:col-span-2">
              <Button type="submit" disabled={busyId === "create"}>
                {busyId === "create" ? "Se creează..." : "Creează"}
              </Button>
              <Button type="button" variant="ghost" onClick={resetEditor}>
                Anulează
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="space-y-3">
        {sortedItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d5dae1] bg-white/65 p-5 text-[#6b7280]">
            Nu există elemente FAQ.
          </div>
        ) : null}

        {sortedItems.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-[#eceff5] bg-white px-4 py-4 shadow-[0_15px_34px_-44px_rgba(15,23,42,0.9)] md:px-5"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 space-y-1">
                <h3 className="m-0 text-base font-semibold text-[#101828]">{item.question}</h3>
                <p className="m-0 text-sm text-[#667085]">{subtitle(item)}</p>
                <p className="m-0 whitespace-pre-wrap text-sm text-[#344054]">{item.answer}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#667085]">
                  <span className="rounded-full bg-[#f3f4f6] px-2 py-0.5">Ordine: {item.order}</span>
                  <span className="rounded-full bg-[#f3f4f6] px-2 py-0.5">
                    {item.isActive ? "Activ" : "Inactiv"}
                  </span>
                  <span>Actualizat: {formatDate(item.updatedAt)}</span>
                </div>
              </div>

              <div className="relative" data-faq-menu>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpenMenuId((prev) => (prev === item.id ? null : item.id))}
                >
                  Acțiuni
                </Button>
                {openMenuId === item.id ? (
                  <div className="absolute right-0 top-10 z-20 min-w-44 rounded-xl border border-[#e5e7eb] bg-white p-2 shadow-lg">
                    <button
                      type="button"
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#1f2937] hover:bg-[#f3f4f6]"
                      onClick={async () => {
                        setOpenMenuId(null);
                        await editItem(item);
                      }}
                    >
                      Editează întrebarea + răspunsul
                    </button>
                    <button
                      type="button"
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#1f2937] hover:bg-[#f3f4f6]"
                      onClick={async () => {
                        const nextCategory = window.prompt("Categorie nouă", item.category ?? "");
                        setOpenMenuId(null);
                        if (nextCategory === null) return;
                        await patchItem(item.id, { category: nextCategory });
                      }}
                    >
                      Schimbă categoria
                    </button>
                    <button
                      type="button"
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#1f2937] hover:bg-[#f3f4f6]"
                      onClick={async () => {
                        const nextOrder = window.prompt("Ordine nouă", String(item.order));
                        setOpenMenuId(null);
                        if (nextOrder === null) return;
                        const parsed = Number(nextOrder);
                        if (Number.isNaN(parsed)) return;
                        await patchItem(item.id, { order: parsed });
                      }}
                    >
                      Schimbă ordinea
                    </button>
                    <button
                      type="button"
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#1f2937] hover:bg-[#f3f4f6]"
                      onClick={async () => {
                        setOpenMenuId(null);
                        await patchItem(item.id, { isActive: !item.isActive });
                      }}
                    >
                      {item.isActive ? "Dezactivează" : "Activează"}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
                      onClick={async () => {
                        setOpenMenuId(null);
                        await deleteItem(item.id);
                      }}
                    >
                      {busyId === item.id ? "Se șterge..." : "Șterge"}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
