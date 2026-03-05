from __future__ import annotations

import hashlib
from typing import Sequence

from openai import AsyncOpenAI

EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIM = 1536


class Embedder:
    def __init__(self, api_key: str) -> None:
        self._api_key = api_key
        self._client = AsyncOpenAI(api_key=api_key) if api_key else None

    async def embed_texts(self, texts: Sequence[str]) -> list[list[float]]:
        if not texts:
            return []

        if self._client is None:
            return [self._fake_embedding(text) for text in texts]

        try:
            response = await self._client.embeddings.create(model=EMBEDDING_MODEL, input=list(texts))
            return [item.embedding for item in response.data]
        except Exception:
            return [self._fake_embedding(text) for text in texts]

    def _fake_embedding(self, text: str) -> list[float]:
        digest = hashlib.sha256(text.encode("utf-8")).digest()
        values = []
        for i in range(EMBEDDING_DIM):
            byte = digest[i % len(digest)]
            values.append((byte / 255.0) * 2.0 - 1.0)
        return values
