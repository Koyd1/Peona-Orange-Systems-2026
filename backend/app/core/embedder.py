from __future__ import annotations

import hashlib
import logging
from typing import Sequence

from openai import AsyncOpenAI

LOGGER = logging.getLogger(__name__)


class Embedder:
    def __init__(self, *, api_key: str, model: str, dimensions: int) -> None:
        self._model = model
        self._dimensions = dimensions
        self._client = AsyncOpenAI(api_key=api_key) if api_key else None

    async def embed_texts(self, texts: Sequence[str]) -> list[list[float]]:
        if not texts:
            return []

        if self._client is None:
            return [self._fake_embedding(text) for text in texts]

        try:
            response = await self._client.embeddings.create(
                model=self._model,
                input=list(texts),
                dimensions=self._dimensions,
            )
            return [item.embedding for item in response.data]
        except Exception as exc:
            LOGGER.warning(
                "embedder.api_failed",
                extra={"texts_count": len(texts), "error": str(exc)},
            )
            return [self._fake_embedding(text) for text in texts]

    def _fake_embedding(self, text: str) -> list[float]:
        digest = hashlib.sha256(text.encode("utf-8")).digest()
        values = []
        for i in range(self._dimensions):
            byte = digest[i % len(digest)]
            values.append((byte / 255.0) * 2.0 - 1.0)
        return values
