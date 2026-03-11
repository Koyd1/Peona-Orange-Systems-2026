"use client";

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
  onDownload: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReindex: (id: string) => Promise<void>;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const STATUS_PILL: Record<KnowledgeFileRow["status"], string> = {
  READY: "status-pill status-pill-ready",
  PENDING: "status-pill status-pill-pending",
  PROCESSING: "status-pill status-pill-processing",
  ERROR: "status-pill status-pill-error",
};

export default function FileTable({
  files,
  loading,
  busyId,
  onDownload,
  onDelete,
  onReindex
}: FileTableProps) {
  return (
    <div className="card">
      <div className="section-header">
        <h2>Файлы базы знаний</h2>
        {loading ? <span className="text-sm text-muted">Обновление...</span> : null}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Filename</th>
              <th>Size</th>
              <th>Status</th>
              <th>Chunks</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.id}>
                <td>{file.filename}</td>
                <td>{formatBytes(file.size)}</td>
                <td>
                  <span className={STATUS_PILL[file.status]}>{file.status}</span>
                </td>
                <td>{file.chunkCount ?? "-"}</td>
                <td>{new Date(file.updatedAt).toLocaleString()}</td>
                <td>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      disabled={busyId === file.id}
                      onClick={async () => {
                        await onDownload(file.id);
                      }}
                    >
                      Download
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
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
                      className="btn btn-sm btn-outline-orange"
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
                <td colSpan={6}>
                  <div className="empty-state">
                    <div className="empty-state-icon">📂</div>
                    <h3>Нет загруженных файлов</h3>
                    <p>Загрузите документы через форму выше</p>
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
