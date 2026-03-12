"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import FileTable, { type KnowledgeFileRow } from "@/components/admin/FileTable";
import FileUpload from "@/components/admin/FileUpload";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

const POLLABLE_STATUSES = new Set<KnowledgeFileRow["status"]>(["PENDING", "PROCESSING"]);

type ListResponse = {
  items: KnowledgeFileRow[];
};

type LoadFilesOptions = {
  silent?: boolean;
};

function filenameFromContentDisposition(contentDisposition: string | null): string | null {
  if (!contentDisposition) {
    return null;
  }

  const encodedMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch?.[1]) {
    try {
      return decodeURIComponent(encodedMatch[1]);
    } catch {
      return encodedMatch[1];
    }
  }

  const plainMatch = contentDisposition.match(/filename="([^"]+)"/i);
  if (plainMatch?.[1]) {
    return plainMatch[1];
  }

  return null;
}

function filesAreEqual(current: KnowledgeFileRow[], next: KnowledgeFileRow[]): boolean {
  if (current.length !== next.length) {
    return false;
  }

  return current.every((file, index) => {
    const candidate = next[index];
    return (
      file.id === candidate.id &&
      file.filename === candidate.filename &&
      file.size === candidate.size &&
      file.status === candidate.status &&
      file.chunkCount === candidate.chunkCount &&
      file.createdAt === candidate.createdAt &&
      file.updatedAt === candidate.updatedAt
    );
  });
}

export default function AdminKnowledgePage() {
  const [files, setFiles] = useState<KnowledgeFileRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasPollableRows = useMemo(
    () => files.some((file) => POLLABLE_STATUSES.has(file.status)),
    [files]
  );

  const loadFiles = useCallback(async ({ silent = false }: LoadFilesOptions = {}) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const response = await fetch("/api/upload", { cache: "no-store" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error ?? body?.detail ?? "Не удалось загрузить список файлов");
      }
      const payload = (await response.json()) as ListResponse;
      const nextFiles = payload.items ?? [];
      setFiles((current) => (filesAreEqual(current, nextFiles) ? current : nextFiles));
    } catch (loadError) {
      if (!silent) {
        setError(loadError instanceof Error ? loadError.message : "Ошибка загрузки");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
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
      void loadFiles({ silent: true });
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

  async function handleDownload(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const response = await fetch(`/api/upload/${id}/download`, {
        method: "GET",
        cache: "no-store"
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error ?? body?.detail ?? "Скачивание не удалось");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      const fallbackName = files.find((file) => file.id === id)?.filename ?? `knowledge-${id}`;
      const filename = filenameFromContentDisposition(contentDisposition) ?? fallbackName;

      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Ошибка скачивания");
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
      <Card className="mb-4">
        <CardHeader>
          <div>
            <CardTitle className="text-2xl">Knowledge Base</CardTitle>
            <CardDescription>
              Управление документами: upload, status polling, download, delete и re-index.
            </CardDescription>
          </div>
          <Link href="/admin/prompts" className={buttonVariants({ variant: "secondary", size: "sm" })}>
            Open prompts
          </Link>
        </CardHeader>
        {error ? <Alert variant="error">{error}</Alert> : null}
      </Card>

      <FileUpload onUploaded={loadFiles} />
      <FileTable
        files={files}
        loading={loading}
        busyId={busyId}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onReindex={handleReindex}
      />
    </>
  );
}
