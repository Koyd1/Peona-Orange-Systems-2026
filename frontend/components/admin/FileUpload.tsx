"use client";

import { useRef, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FileUploadProps = {
  onUploaded: () => Promise<void>;
  compact?: boolean;
  buttonLabel?: string;
  className?: string;
};

const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"];
const MAX_FILE_MB = 15;

function hasSupportedExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return SUPPORTED_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

export default function FileUpload({
  onUploaded,
  compact = false,
  buttonLabel = "Upload file",
  className
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function uploadFile(file: File) {
    if (!hasSupportedExtension(file.name)) {
      setError("Sunt acceptate doar fișiere PDF, DOCX, TXT, MD.");
      return;
    }

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`Fișierul depășește limita de ${MAX_FILE_MB} MB.`);
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

      setSuccess(`Fișierul ${file.name} a fost încărcat.`);
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
    <div
      className={cn(
        compact
          ? "flex flex-col items-start gap-3"
          : "rounded-2xl border border-[#edf0f5] bg-white p-6 shadow-[0_20px_48px_-44px_rgba(15,23,42,0.85)]",
        className
      )}
    >
      {!compact ? (
        <div className="space-y-1">
          <h2 className="m-0 text-lg font-semibold text-[#101828]">Încarcă document</h2>
          <p className="m-0 text-sm text-[#667085]">
            Formate: PDF, DOCX, TXT, MD. Dimensiune maximă: {MAX_FILE_MB} MB.
          </p>
        </div>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept=".pdf,.docx,.txt,.md"
        disabled={isUploading}
        onChange={async (event) => {
          const selected = event.currentTarget.files?.[0];
          if (selected) {
            await uploadFile(selected);
          }
        }}
      />
      <Button
        type="button"
        variant="primary"
        size="lg"
        className="w-full min-w-[220px] text-base lg:w-auto"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
      >
        <span className="text-base leading-none">↑</span>
        {isUploading ? "Se încarcă..." : buttonLabel}
      </Button>

      {error ? <Alert variant="error">{error}</Alert> : null}
      {success ? <Alert variant="success">{success}</Alert> : null}
      {!compact ? (
        <p className="m-0 text-xs text-[#98a2b3]">
          După încărcare, documentul va intra automat în pipeline-ul de indexare.
        </p>
      ) : null}
    </div>
  );
}
