from __future__ import annotations

import json
import logging
from collections.abc import AsyncIterator

from openai import AsyncOpenAI

LOGGER = logging.getLogger(__name__)


def encode_sse(payload: dict) -> bytes:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n".encode("utf-8")


class ChatStreamer:
    def __init__(self, *, api_key: str, model: str, fallback_models: list[str] | None = None) -> None:
        self._model = model
        self._fallback_models = fallback_models or []
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

        model_candidates = [self._model, *self._fallback_models]
        deduped_models: list[str] = []
        for candidate in model_candidates:
            if candidate and candidate not in deduped_models:
                deduped_models.append(candidate)

        last_error: Exception | None = None
        try:
            for model_name in deduped_models:
                try:
                    stream = await self._client.chat.completions.create(
                        model=model_name,
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
                    return
                except Exception as exc:
                    last_error = exc
                    LOGGER.warning(
                        "chat_streamer.model_failed",
                        extra={"model": model_name, "error": str(exc)},
                    )
        except Exception as exc:
            last_error = exc

        if last_error is not None:
            LOGGER.error("chat_streamer.all_models_failed", extra={"error": str(last_error)})
            async for token in self._fallback_tokens(user_message, context_blocks):
                yield token

    def _fallback_answer(self, user_message: str, context_blocks: list[str]) -> str:
        return (
            "Сейчас не удалось сгенерировать ответ моделью. "
            "Попробуйте повторить запрос позже. "
            f"Ваш запрос: {user_message}"
        )

    async def _fallback_tokens(
        self, user_message: str, context_blocks: list[str]
    ) -> AsyncIterator[str]:
        fallback = self._fallback_answer(user_message, context_blocks)
        for token in fallback.split(" "):
            yield f"{token} "
