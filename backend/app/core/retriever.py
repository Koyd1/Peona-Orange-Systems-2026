from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


@dataclass(slots=True)
class RetrievedSource:
    file_id: str
    content: str
    metadata: dict | None
    similarity: float


class Retriever:
    def __init__(self, *, top_k: int, similarity_threshold: float) -> None:
        self._top_k = top_k
        self._similarity_threshold = similarity_threshold

    async def retrieve(
        self,
        db: AsyncSession,
        query_embedding: list[float],
    ) -> list[RetrievedSource]:
        vector_literal = "[" + ",".join(f"{value:.10f}" for value in query_embedding) + "]"

        sql = text(
            """
            SELECT
              file_id,
              content,
              metadata,
              1 - (embedding <=> CAST(:embedding AS vector)) AS similarity
            FROM vector_chunks
            WHERE 1 - (embedding <=> CAST(:embedding AS vector)) >= :threshold
            ORDER BY embedding <=> CAST(:embedding AS vector)
            LIMIT :limit
            """
        )

        result = await db.execute(
            sql,
            {
                "embedding": vector_literal,
                "threshold": self._similarity_threshold,
                "limit": self._top_k,
            },
        )

        sources: list[RetrievedSource] = []
        for row in result.mappings():
            sources.append(
                RetrievedSource(
                    file_id=str(row["file_id"]),
                    content=str(row["content"]),
                    metadata=row.get("metadata") if isinstance(row.get("metadata"), dict) else None,
                    similarity=float(row["similarity"]),
                )
            )

        return sources
