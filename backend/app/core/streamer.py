from __future__ import annotations

import json
from collections.abc import AsyncIterator

from openai import AsyncOpenAI


def encode_sse(payload: dict) -> bytes:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n".encode("utf-8")


class ChatStreamer:
    def __init__(self, *, api_key: str, model: str) -> None:
        self._model = model
        self._client = AsyncOpenAI(api_key=api_key) if api_key else None

    async def stream_answer(
        self,
        *,
        user_message: str,
        context_blocks: list[str],
    ) -> AsyncIterator[str]:
        if self._client is None:
            async for token in self._fallback_tokens(user_message, context_blocks):
                yield token
            return

        system_prompt = (
            "You are an HR assistant. Answer only using provided context. "
            "If context is insufficient, clearly state uncertainty."
        )
        context_text = "\n\n".join(context_blocks) if context_blocks else "No context provided."

        try:
            stream = await self._client.chat.completions.create(
                model=self._model,
                stream=True,
                temperature=0.2,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "system", "content": f"Context:\n{context_text}"},
                    {"role": "user", "content": user_message},
                ],
            )

            async for chunk in stream:
                delta = chunk.choices[0].delta.content if chunk.choices else None
                if delta:
                    yield delta
        except Exception:
            async for token in self._fallback_tokens(user_message, context_blocks):
                yield token

    def _fallback_answer(self, user_message: str, context_blocks: list[str]) -> str:
        if not context_blocks:
            return (
                "Недостаточно данных в базе знаний для уверенного ответа. "
                "Пожалуйста, загрузите релевантный документ."
            )

        snippet = context_blocks[0][:300]
        return (
            "На основе доступного контекста: "
            f"{snippet}"
            f". Запрос: {user_message}"
        )

    async def _fallback_tokens(
        self, user_message: str, context_blocks: list[str]
    ) -> AsyncIterator[str]:
        fallback = self._fallback_answer(user_message, context_blocks)
        for token in fallback.split(" "):
            yield f"{token} "
