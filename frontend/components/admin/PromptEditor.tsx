"use client";

import { useEffect, useState } from "react";

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
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Prompt Templates</h2>
      {loading ? <p>Загрузка...</p> : null}
      {error ? <p style={{ color: "#b42318" }}>{error}</p> : null}

      <div
        style={{
          border: "1px solid #d0d5dd",
          borderRadius: 8,
          padding: 10,
          marginBottom: 16,
          background: "#f8fafc"
        }}
      >
        <h3 style={{ marginTop: 0 }}>Новый шаблон</h3>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            await createTemplate();
          }}
        >
          <input
            placeholder="Title"
            value={draft.title}
            onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
          />
          <textarea
            placeholder="Content"
            value={draft.content}
            onChange={(event) => setDraft((prev) => ({ ...prev, content: event.target.value }))}
            rows={4}
            style={{ resize: "vertical" }}
          />
          <input
            placeholder="Category"
            value={draft.category}
            onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value }))}
          />
          <input
            type="number"
            min={0}
            max={9999}
            value={draft.order}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, order: Number(event.target.value || 0) }))
            }
          />
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(event) => setDraft((prev) => ({ ...prev, isActive: event.target.checked }))}
            />
            Active
          </label>
          <button type="submit" disabled={busyId === "create"}>
            Create
          </button>
        </form>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{ border: "1px solid #e4e7ec", borderRadius: 8, padding: 10, background: "#fff" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <strong>{item.title}</strong>
              <span style={{ fontSize: 12, color: "#475467" }}>
                {item.isActive ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>
            <p style={{ margin: "8px 0" }}>{item.content}</p>
            <p style={{ margin: "8px 0", fontSize: 12, color: "#475467" }}>
              category: {item.category ?? "-"} | order: {item.order}
            </p>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={async () => {
                  const title = window.prompt("New title", item.title);
                  if (title === null) return;
                  await patchTemplate(item.id, { title });
                }}
              >
                Edit title
              </button>
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={async () => {
                  const content = window.prompt("New content", item.content);
                  if (content === null) return;
                  await patchTemplate(item.id, { content });
                }}
              >
                Edit content
              </button>
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={async () => {
                  await patchTemplate(item.id, { isActive: !item.isActive });
                }}
              >
                {item.isActive ? "Deactivate" : "Activate"}
              </button>
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={async () => {
                  const nextOrder = window.prompt("New order", String(item.order));
                  if (nextOrder === null) return;
                  await patchTemplate(item.id, { order: Number(nextOrder) || 0 });
                }}
              >
                Change order
              </button>
              <button type="button" disabled={busyId === item.id} onClick={() => void deleteTemplate(item.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
