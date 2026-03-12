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

const EMPTY_DRAFT: Draft = {
  title: "",
  content: "",
  category: "",
  order: 100,
  isActive: true
};

export default function PromptEditor() {
  const [items, setItems] = useState<PromptTemplate[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
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
        const text = await response.text();
        throw new Error(text || "Create failed");
      }

      setDraft(EMPTY_DRAFT);
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Create failed");
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
        const text = await response.text();
        throw new Error(text || "Update failed");
      }

      await load();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Update failed");
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

  return (
    <Card>
      <h2 className="text-lg font-semibold mt-0">Prompt Templates</h2>
      {loading ? <p className="text-sm text-gray-400">Загрузка...</p> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}

      <div className="border border-border-strong rounded-lg p-3 mb-4 bg-gray-50">
        <h3 className="text-base font-semibold mt-0 mb-2">Новый шаблон</h3>
        <form
          className="grid gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            await createTemplate();
          }}
        >
          <Input
            placeholder="Title"
            value={draft.title}
            onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
          />
          <Textarea
            placeholder="Content"
            value={draft.content}
            onChange={(event) => setDraft((prev) => ({ ...prev, content: event.target.value }))}
            rows={4}
          />
          <Input
            placeholder="Category"
            value={draft.category}
            onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value }))}
          />
          <Input
            type="number"
            min={0}
            max={9999}
            value={draft.order}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, order: Number(event.target.value || 0) }))
            }
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(event) => setDraft((prev) => ({ ...prev, isActive: event.target.checked }))}
              className="accent-orange-500"
            />
            Active
          </label>
          <Button size="sm" disabled={busyId === "create"}>
            Create
          </Button>
        </form>
      </div>

      <div className="grid gap-2.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="border border-border rounded-lg p-3 bg-white"
          >
            <div className="flex justify-between gap-2.5">
              <strong>{item.title}</strong>
              <Badge variant={item.isActive ? "ready" : "pending"} dot>
                {item.isActive ? "ACTIVE" : "INACTIVE"}
              </Badge>
            </div>
            <p className="my-2">{item.content}</p>
            <p className="my-2 text-xs text-gray-500">
              category: {item.category ?? "-"} | order: {item.order}
            </p>

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
                disabled={busyId === item.id}
                onClick={async () => {
                  const content = window.prompt("New content", item.content);
                  if (content === null) return;
                  await patchTemplate(item.id, { content });
                }}
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
