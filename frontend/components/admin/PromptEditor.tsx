"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";

type PromptTemplate = {
  id: string;
  title: string;
  content: string;
  category: string | null;
  order: number;
  isActive: boolean;
  updatedAt: string;
};

type Draft = {
  title: string;
  content: string;
  category: string;
  order: number;
  isActive: boolean;
};

function createEmptyDraft(order = 100): Draft {
  return {
    title: "",
    content: "",
    category: "",
    order,
    isActive: true
  };
}

async function readPromptApiError(response: Response, fallback: string) {
  const payload = await response.json().catch(() => null);
  const message =
    (payload && typeof payload === "object" && "error" in payload && payload.error) ||
    (payload && typeof payload === "object" && "detail" in payload && payload.detail);

  if (typeof message === "string" && message.trim()) {
    if (message === "Invalid payload") {
      return "Datele introduse nu sunt valide. Verifică titlul, conținutul, categoria și poziția.";
    }
    return message;
  }

  const text = await response.text().catch(() => "");
  if (text.trim()) {
    return text;
  }

  return fallback;
}

export default function PromptEditor() {
  const [items, setItems] = useState<PromptTemplate[]>([]);
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
      const response = await fetch("/api/admin/prompts", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load prompt templates");
      const payload = (await response.json()) as { items: PromptTemplate[] };
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
      if (target.closest("[data-prompt-menu]")) {
        return;
      }
      setOpenMenuId(null);
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  async function createTemplate() {
    setBusyId("create");
    setError(null);
    try {
      const response = await fetch("/api/admin/prompts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft)
      });
      if (!response.ok) {
        throw new Error(await readPromptApiError(response, "Crearea template-ului a eșuat."));
      }
      setDraft(createEmptyDraft());
      setIsCreateOpen(false);
      await load();
    } catch (createError) {
      setError(
        createError instanceof Error ? createError.message : "Crearea template-ului a eșuat."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function patchTemplate(id: string, patch: Partial<Draft>) {
    setBusyId(id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/prompts/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch)
      });

      if (!response.ok) {
        throw new Error(await readPromptApiError(response, "Actualizarea template-ului a eșuat."));
      }

      await load();
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : "Actualizarea template-ului a eșuat."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function deleteTemplate(id: string) {
    const confirmed = window.confirm("Ștergi acest template?");
    if (!confirmed) return;

    setBusyId(id);
    (null);

    try {
      const response = await fetch(`/api/admin/prompts/${id}`, {
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

  async function editTemplate(item: PromptTemplate) {
    const title = window.prompt("Titlu nou", item.title);
    if (title === null) return;

    const content = window.prompt("Conținut nou", item.content);
    if (content === null) return;

    await patchTemplate(item.id, { title, content });
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

  function subtitle(item: PromptTemplate) {
    if (item.category && item.category.trim().length > 0) {
      return `Categorie: ${item.category}`;
    }
    return "Șablon reutilizabil pentru asistentul AI";
  }

  return (
    <section className="space-y-6">
      <section className="w-full pt-3">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-[760px]">
            <h1 className="m-0 text-[2.25rem] font-bold tracking-[-0.02em] text-[#111827] md:text-[2.75rem]">
              Prompt Templates
            </h1>
            <p className="mt-3 text-lg leading-relaxed text-[#6b7280]">
              Gestionarea șabloanelor de prompturi pentru asistentul AI.
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
              {isCreateOpen ? "Ascunde formularul" : "Creare template"}
            </Button>
          </div>
        </div>
        {error ? <Alert variant="error" className="mt-6 max-w-[760px]">{error}</Alert> : null}
      </section>

      {isCreateOpen ? (
        <section className="rounded-[24px] border border-[#eceff5] bg-white p-5 shadow-[0_20px_48px_-44px_rgba(15,23,42,0.85)] md:p-6">
          <h2 className="m-0 text-xl font-semibold text-[#101828]">Template nou</h2>
          <form
            className="mt-4 grid gap-3 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              await createTemplate();
            }}
          >
            <Input
              placeholder="Titlu"
              value={draft.title}
              onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
              className="bg-white"
            />
            <Input
              placeholder="Categorie"
              value={draft.category}
              onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value }))}
              className="bg-white"
            />
            <Textarea
              placeholder="Conținut"
              value={draft.content}
              onChange={(event) => setDraft((prev) => ({ ...prev, content: event.target.value }))}
              rows={4}
              className="bg-white md:col-span-2"
            />
            <Input
              type="number"
              min={0}
              max={9999}
              value={draft.order}
              className="bg-white"
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, order: Number(event.target.value || 0) }))
              }
            />
            <label className="flex items-center gap-2 rounded-xl border border-[#e4e7ec] bg-white px-3 text-sm text-[#344054]">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(event) => setDraft((prev) => ({ ...prev, isActive: event.target.checked }))}
                className="accent-orange-500"
              />
              Activ
            </label>
            <div className="mt-1 flex flex-wrap gap-2 md:col-span-2">
              <Button type="submit" size="sm" disabled={busyId === "create"}>
                <span className="text-base leading-none">+</span>
                Creare
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={resetEditor}
              >
                Anulează
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-2">
        {sortedItems.map((item) => (
          <article
            key={item.id}
            className="rounded-[22px] border border-[#e8ebf2] bg-white p-5 shadow-[0_8px_24px_-22px_rgba(16,24,40,1)] md:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#fbefe8]">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M7.5 8.75H16.5M7.5 12.25H12M9.8 18.25L6.4 20V16.5C5.52 16.5 4.8 15.78 4.8 14.9V6.1C4.8 5.22 5.52 4.5 6.4 4.5H17.6C18.48 4.5 19.2 5.22 19.2 6.1V14.9C19.2 15.78 18.48 16.5 17.6 16.5H11.5"
                      stroke="#E07620"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <div className="min-w-0">
                  <h3 className="m-0 text-[2rem] font-bold tracking-[-0.02em] text-[#101828]">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-[#667085]">{subtitle(item)}</p>
                </div>
              </div>

              <div className="relative" data-prompt-menu>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-lg text-[#101828] transition hover:bg-[#f5f7fb]"
                  disabled={busyId === item.id}
                  onClick={() =>
                    setOpenMenuId((current) => (current === item.id ? null : item.id))
                  }
                >
                  ⋮
                </button>
                {openMenuId === item.id ? (
                  <div className="absolute right-0 top-10 z-20 min-w-[170px] rounded-2xl border border-[#e4e7ec] bg-white p-2 shadow-[0_16px_38px_-28px_rgba(16,24,40,0.9)]">
                    <button
                      type="button"
                      className="w-full rounded-xl px-3 py-2 text-left text-[0.96rem] text-[#1f2937] transition hover:bg-[#f5f7fb]"
                      onClick={async () => {
                        setOpenMenuId(null);
                        await editTemplate(item);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="w-full rounded-xl px-3 py-2 text-left text-[0.96rem] text-[#1f2937] transition hover:bg-[#f5f7fb]"
                      onClick={async () => {
                        setOpenMenuId(null);
                        const nextOrder = window.prompt("Ordine nouă", String(item.order));
                        if (nextOrder === null) return;
                        await patchTemplate(item.id, { order: Number(nextOrder) || 0 });
                      }}
                    >
                      Change order
                    </button>
                    <button
                      type="button"
                      className="w-full rounded-xl px-3 py-2 text-left text-[0.96rem] text-[#1f2937] transition hover:bg-[#f5f7fb]"
                      onClick={async () => {
                        setOpenMenuId(null);
                        await patchTemplate(item.id, { isActive: !item.isActive });
                      }}
                    >
                      {item.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      className="w-full rounded-xl px-3 py-2 text-left text-[0.96rem] text-[#b42318] transition hover:bg-[#fff3f2]"
                      onClick={async () => {
                        setOpenMenuId(null);
                        await deleteTemplate(item.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <p className="mt-5 min-h-[112px] overflow-hidden text-[1.02rem] leading-relaxed text-[#475467] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4]">
              {item.content}
            </p>

            <div className="mt-6 flex items-center justify-between gap-3">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                  item.isActive
                    ? "bg-[#fbefe8] text-[#b54708]"
                    : "bg-[#f2f4f7] text-[#667085]"
                }`}
              >
                {item.category?.trim() || "General"}
              </span>
              <span className="text-sm text-[#98a2b3]">{formatDate(item.updatedAt)}</span>
            </div>
          </article>
        ))}
        {sortedItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d0d5dd] bg-[#fcfdff] px-4 py-12 text-center lg:col-span-2">
            <p className="m-0 text-base font-semibold text-[#344054]">Nu există template-uri definite.</p>
            <p className="mt-2 text-sm text-[#667085]">
              Creează primul template din butonul „Creare template”.
            </p>
          </div>
        ) : null}
      </section>
    </section>
  );
}
