"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

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

const STATUS_VARIANT: Record<KnowledgeFileRow["status"], BadgeProps["variant"]> = {
  READY: "ready",
  PENDING: "pending",
  PROCESSING: "processing",
  ERROR: "error",
};

export default function FileTable({
  files,
  loading,
  busyId,
  onDownload,
  onDelete,
  onReindex
}: FileTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (target.closest("[data-actions-menu]")) {
        return;
      }
      setOpenMenuId(null);
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const totalLabel = useMemo(() => {
    if (totalCount === 1) {
      return "1 fișier în baza de cunoștințe";
    }
    return `${totalCount} fișiere în baza de cunoștințe`;
  }, [totalCount]);

  function statusPresentation(status: KnowledgeFileRow["status"]) {
    if (status === "PENDING") {
      return {
        label: "În așteptare",
        className: "bg-slate-100 text-slate-700"
      };
    }
    if (status === "PROCESSING") {
      return {
        label: "În procesare",
        className: "bg-amber-100 text-amber-700"
      };
    }
    if (status === "READY") {
      return {
        label: "Finalizat",
        className: "bg-emerald-100 text-emerald-700"
      };
    }
    if (status === "ERROR") {
      return {
        label: "Eroare",
        className: "bg-red-100 text-red-700"
      };
    }
    return {
      label: "Eroare",
      className: "bg-red-100 text-red-700"
    };
  }

  return (
    <section className="rounded-[30px] border border-[#e8eaf1] bg-[#fcfdff] px-4 py-5 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.65)] md:px-6 md:py-6">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="m-0 text-[1.9rem] font-bold tracking-[-0.02em] text-[#0f172a]">
            Fișiere încărcate
          </h2>
          <p className="mt-2 text-[1.02rem] text-[#667085]">{totalLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          {loading ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-[#eef2ff] px-3 py-1.5 text-sm text-[#4338ca]">
              <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-[#a5b4fc] border-t-[#4338ca]" />
              Actualizare...
            </span>
          ) : null}
          <label className="inline-flex items-center gap-3 rounded-2xl border border-[#eef2f7] bg-[#f6f8fc] px-4 py-2.5 text-sm font-medium text-[#6b7280] shadow-[0_12px_28px_-24px_rgba(15,23,42,0.45)]">
            <span>Sortează după:</span>
            <span className="relative inline-flex min-w-[92px] items-center">
              <select
                value={sortOrder}
                onChange={(event) =>
                  onSortOrderChange(event.target.value === "oldest" ? "oldest" : "newest")
                }
                className="h-10 w-full appearance-none rounded-xl border border-[#e8ecf4] bg-white px-3 pr-10 text-sm font-semibold text-[#1f2937] shadow-[0_8px_20px_-18px_rgba(15,23,42,0.45)] outline-none transition hover:border-[#d7ddea] focus:border-[#f28c28] focus:ring-2 focus:ring-[#fde6d2]"
              >
                <option value="newest">Noi</option>
                <option value="oldest">Vechi</option>
              </select>
              <span className="pointer-events-none absolute right-3 text-[#475467]">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M5 7.5L10 12.5L15 7.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#edf0f5] bg-white">
        <div className="max-h-[410px] overflow-y-auto pr-1">
          <table className="w-full min-w-[740px] border-collapse">
            <thead className="sticky top-0 z-10 bg-[#fafbfe]">
              <tr className="border-b border-[#eef1f5]">
                <th className="px-4 py-4 text-left text-sm font-semibold text-[#98a2b3]">Denumire</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-[#98a2b3]">Mărimea fișierului</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-[#98a2b3]">Data încărcării</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-[#98a2b3]">Statut</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-[#98a2b3]">Chunks</th>
                <th className="px-4 py-4 text-right text-sm font-semibold text-[#98a2b3]">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => {
                const status = statusPresentation(file.status);
                const isBusy = busyId === file.id;


      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Filename</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Chunks</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.id}>
              <TableCell>{file.filename}</TableCell>
              <TableCell>{formatBytes(file.size)}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[file.status]} dot>
                  {file.status}
                </Badge>
              </TableCell>
              <TableCell>{file.chunkCount ?? "-"}</TableCell>
              <TableCell>{new Date(file.updatedAt).toLocaleString()}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busyId === file.id}
                    onClick={async () => {
                      await onDownload(file.id);
                    }}
                  >
                    Download
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
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
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyId === file.id}
                    onClick={async () => {
                      await onReindex(file.id);
                    }}
                  >
                    Re-index
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {files.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6}>
                <div className="flex flex-col items-center justify-center text-center py-16 px-6 text-gray-400">
                  <div className="text-4xl mb-4 opacity-50">📂</div>
                  <h3 className="text-gray-500 mb-2 font-semibold">Нет загруженных файлов</h3>
                  <p className="max-w-[360px] text-sm">Загрузите документы через форму выше</p>
                </div>
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </Card>
  );
}
