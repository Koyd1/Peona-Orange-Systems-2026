"use client";

import { useRef, useState } from "react";

type FileUploadProps = {
  onUploaded: () => Promise<void>;
};

const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"];
const MAX_FILE_MB = 15;

function hasSupportedExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return SUPPORTED_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

export default function FileUpload({ onUploaded }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function uploadFile(file: File) {
    if (!hasSupportedExtension(file.name)) {
      setError("Поддерживаются только PDF, DOCX, TXT, MD");
      return;
    }

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`Файл больше ${MAX_FILE_MB}MB`);
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.detail ?? body?.error ?? "Upload failed");
      }

      setSuccess(`Файл ${file.name} загружен`);
      await onUploaded();
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h2 style={{ marginTop: 0 }}>Загрузка файла</h2>
      <p style={{ marginTop: 0 }}>Поддержка: PDF, DOCX, TXT, MD</p>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md"
        disabled={isUploading}
        onChange={async (event) => {
          const selected = event.currentTarget.files?.[0];
          if (selected) {
            await uploadFile(selected);
          }
        }}
      />

      {isUploading ? <p>Загрузка...</p> : null}
      {error ? <p style={{ color: "#b42318" }}>{error}</p> : null}
      {success ? <p style={{ color: "#027a48" }}>{success}</p> : null}
    </div>
  );
}
