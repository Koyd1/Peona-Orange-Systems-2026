from __future__ import annotations

import asyncio
import logging
import tempfile
from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core.embedder import Embedder
from app.db.models import KnowledgeFile, VectorChunk
from app.storage.minio import MinioStorage

LOGGER = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md"}


@dataclass(slots=True)
class IngestResult:
    chunk_count: int


class RAGIngestPipeline:
    def __init__(
        self,
        *,
        session_factory: async_sessionmaker,
        storage: MinioStorage,
        embedder: Embedder,
        tmp_dir: str,
    ) -> None:
        self._session_factory = session_factory
        self._storage = storage
        self._embedder = embedder
        self._tmp_dir = tmp_dir
        Path(self._tmp_dir).mkdir(parents=True, exist_ok=True)

    async def run(self, file_id: str) -> None:
        async with self._session_factory() as session:
            file = await session.scalar(select(KnowledgeFile).where(KnowledgeFile.id == file_id))
            if file is None:
                LOGGER.warning("ingest.file_not_found", extra={"file_id": file_id})
                return

            file.status = "PROCESSING"
            await session.commit()

        try:
            chunks = await self._extract_chunks(file_id)
            embeddings = await self._embedder.embed_texts(chunks)

            async with self._session_factory() as session:
                file = await session.scalar(select(KnowledgeFile).where(KnowledgeFile.id == file_id))
                if file is None:
                    return

                await session.execute(delete(VectorChunk).where(VectorChunk.file_id == file_id))

                session.add_all(
                    [
                        VectorChunk(
                            id=str(uuid4()),
                            file_id=file_id,
                            content=chunk,
                            embedding=embedding,
                            meta={"source": file.storage_path},
                        )
                        for chunk, embedding in zip(chunks, embeddings, strict=False)
                    ]
                )

                file.chunk_count = len(chunks)
                file.status = "READY"
                await session.commit()

        except Exception:
            LOGGER.exception("ingest.failed", extra={"file_id": file_id})
            async with self._session_factory() as session:
                file = await session.scalar(select(KnowledgeFile).where(KnowledgeFile.id == file_id))
                if file:
                    file.status = "ERROR"
                    await session.commit()

    async def _extract_chunks(self, file_id: str) -> list[str]:
        async with self._session_factory() as session:
            file = await session.scalar(select(KnowledgeFile).where(KnowledgeFile.id == file_id))
            if file is None:
                raise RuntimeError("Knowledge file does not exist")
            storage_path = file.storage_path
            filename = file.filename

        blob = await asyncio.to_thread(self._storage.download_bytes, storage_path)

        with tempfile.TemporaryDirectory(prefix="ingest-", dir=self._tmp_dir) as temp_dir:
            local_path = Path(temp_dir) / filename
            local_path.write_bytes(blob)
            text = await asyncio.to_thread(self._extract_text_from_file, local_path)

        chunks = [chunk for chunk in self._split_text(text) if chunk.strip()]
        if not chunks:
            raise RuntimeError("No chunks extracted from document")

        return chunks

    def _extract_text_from_file(self, path: Path) -> str:
        ext = path.suffix.lower()
        if ext not in SUPPORTED_EXTENSIONS:
            raise ValueError(f"Unsupported extension: {ext}")

        if ext in {".txt", ".md"}:
            return path.read_text(encoding="utf-8", errors="ignore")

        if ext == ".pdf":
            from pypdf import PdfReader

            reader = PdfReader(str(path))
            return "\n".join((page.extract_text() or "") for page in reader.pages)

        if ext == ".docx":
            from docx import Document

            doc = Document(str(path))
            return "\n".join(par.text for par in doc.paragraphs)

        raise ValueError(f"Unsupported extension: {ext}")

    def _split_text(self, text: str, chunk_size: int = 1200, overlap: int = 150) -> list[str]:
        clean = " ".join(text.split())
        if not clean:
            return []

        chunks: list[str] = []
        start = 0
        while start < len(clean):
            end = min(start + chunk_size, len(clean))
            chunks.append(clean[start:end])
            if end >= len(clean):
                break
            start = max(0, end - overlap)
        return chunks
