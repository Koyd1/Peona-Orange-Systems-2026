"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

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
    const confirmed = window.confirm("Удалить шаблон?");
    if (!confirmed) return;

    setBusyId(id);
    setError(null);

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

            <div className="flex gap-2 flex-wrap">
              <Button
                variant="secondary"
                size="sm"
                disabled={busyId === item.id}
                onClick={async () => {
                  const title = window.prompt("New title", item.title);
                  if (title === null) return;
                  await patchTemplate(item.id, { title });
                }}
              >
                Edit title
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={resetEditor}
              >
                Edit content
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={busyId === item.id}
                onClick={async () => {
                  await patchTemplate(item.id, { isActive: !item.isActive });
                }}
              >
                {item.isActive ? "Deactivate" : "Activate"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={busyId === item.id}
                onClick={async () => {
                  const nextOrder = window.prompt("New order", String(item.order));
                  if (nextOrder === null) return;
                  await patchTemplate(item.id, { order: Number(nextOrder) || 0 });
                }}
              >
                Change order
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={busyId === item.id}
                onClick={() => void deleteTemplate(item.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
