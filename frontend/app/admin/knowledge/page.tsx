"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import FileTable, { type KnowledgeFileRow } from "@/components/admin/FileTable";
import FileUpload from "@/components/admin/FileUpload";

const POLLABLE_STATUSES = new Set<KnowledgeFileRow["status"]>(["PENDING", "PROCESSING"]);

type ListResponse = {
  items: KnowledgeFileRow[];
};

export default function AdminKnowledgePage() {
  const [files, setFiles] = useState<KnowledgeFileRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasPollableRows = useMemo(
    () => files.some((file) => POLLABLE_STATUSES.has(file.status)),
    [files]
  );

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/upload", { cache: "no-store" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error ?? body?.detail ?? "Не удалось загрузить список файлов");
      }
      const payload = (await response.json()) as ListResponse;
      setFiles(payload.items ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  useEffect(() => {
    if (!hasPollableRows) {
      return;
    }

    const timer = window.setInterval(() => {
      void loadFiles();
    }, 3000);

    return () => {
      window.clearInterval(timer);
    };
  }, [hasPollableRows, loadFiles]);

  async function handleDelete(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const response = await fetch(`/api/upload/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error ?? body?.detail ?? "Удаление не удалось");
      }
      await loadFiles();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Ошибка удаления");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReindex(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const response = await fetch(`/api/upload/${id}`, { method: "POST" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error ?? body?.detail ?? "Re-index не удался");
      }
      await loadFiles();
    } catch (reindexError) {
      setError(reindexError instanceof Error ? reindexError.message : "Ошибка re-index");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <h1 style={{ marginTop: 0 }}>Knowledge Base</h1>
        <p style={{ marginTop: 0 }}>
          Управление документами: upload, status polling, delete и re-index.
        </p>
        {error ? <p style={{ color: "#b42318" }}>{error}</p> : null}
      </div>

      <FileUpload onUploaded={loadFiles} />
      <FileTable
        files={files}
        loading={loading}
        busyId={busyId}
        onDelete={handleDelete}
        onReindex={handleReindex}
      />
    </>
  );
}
