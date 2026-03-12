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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Файлы базы знаний</CardTitle>
        {loading ? <span className="text-sm text-gray-400">Обновление...</span> : null}
      </CardHeader>

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
