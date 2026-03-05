"use client";

import type { CSSProperties } from "react";

export type KnowledgeFileRow = {
  id: string;
  filename: string;
  size: number;
  status: "PENDING" | "PROCESSING" | "READY" | "ERROR";
  chunkCount: number | null;
  createdAt: string;
  updatedAt: string;
};

type FileTableProps = {
  files: KnowledgeFileRow[];
  loading: boolean;
  busyId: string | null;
  onDelete: (id: string) => Promise<void>;
  onReindex: (id: string) => Promise<void>;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function statusStyle(status: KnowledgeFileRow["status"]): CSSProperties {
  if (status === "READY") return { color: "#027a48", fontWeight: 600 };
  if (status === "ERROR") return { color: "#b42318", fontWeight: 600 };
  return { color: "#b54708", fontWeight: 600 };
}

export default function FileTable({
  files,
  loading,
  busyId,
  onDelete,
  onReindex
}: FileTableProps) {
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Файлы базы знаний</h2>
      {loading ? <p>Обновление списка...</p> : null}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">Filename</th>
              <th align="left">Size</th>
              <th align="left">Status</th>
              <th align="left">Chunks</th>
              <th align="left">Updated</th>
              <th align="left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.id} style={{ borderTop: "1px solid #e4e7ec" }}>
                <td style={{ padding: "8px 0" }}>{file.filename}</td>
                <td>{formatBytes(file.size)}</td>
                <td style={statusStyle(file.status)}>{file.status}</td>
                <td>{file.chunkCount ?? "-"}</td>
                <td>{new Date(file.updatedAt).toLocaleString()}</td>
                <td>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      disabled={busyId === file.id}
                      onClick={async () => {
                        const confirmed = window.confirm(
                          `Удалить ${file.filename} и все векторные чанки?`
                        );
                        if (!confirmed) return;
                        await onDelete(file.id);
                      }}
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      disabled={busyId === file.id}
                      onClick={async () => {
                        await onReindex(file.id);
                      }}
                    >
                      Re-index
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {files.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ paddingTop: 12 }}>
                  Нет загруженных файлов.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
