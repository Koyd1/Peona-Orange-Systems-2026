from __future__ import annotations

import json
from typing import Any

from openai import AsyncOpenAI


class HallucinationJudge:
    def __init__(self, *, api_key: str, model: str) -> None:
        self._model = model
        self._client = AsyncOpenAI(api_key=api_key) if api_key else None

    async def score(self, *, answer: str, context_blocks: list[str]) -> dict[str, Any]:
        if not answer.strip():
            return {"hallScore": 1.0, "reason": "empty_answer", "model": "rule-based"}
        if not context_blocks:
            return {"hallScore": 0.8, "reason": "no_context", "model": "rule-based"}
        if self._client is None:
            return {"hallScore": 0.35, "reason": "judge_not_configured", "model": "rule-based"}

        try:
            context_text = "\n\n".join(context_blocks[:8])[:12000]
            response = await self._client.chat.completions.create(
                model=self._model,
                temperature=0,
                response_format={"type": "json_object"},
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a strict RAG hallucination judge. "
                            "Return only JSON: {\"hallScore\": float, \"reason\": string}. "
                            "hallScore must be between 0 and 1 where 1 means highly hallucinated."
                        ),
                    },
                    {"role": "system", "content": f"Context:\n{context_text}"},
                    {"role": "user", "content": f"Answer:\n{answer}"},
                ],
            )

            raw = response.choices[0].message.content if response.choices else None
            if not raw:
                return {"hallScore": 0.5, "reason": "empty_judge_output", "model": self._model}

            data = json.loads(raw)
            value = float(data.get("hallScore", 0.5))
            score = max(0.0, min(1.0, value))
            reason = str(data.get("reason", "n/a"))[:500]
            return {"hallScore": score, "reason": reason, "model": self._model}
        except Exception:
            return {"hallScore": 0.5, "reason": "judge_error_fallback", "model": "rule-based"}


def score_hallucination(answer: str, context_blocks: list[str]) -> float:
    if not answer.strip():
        return 1.0
    if not context_blocks:
        return 0.8
    return 0.2
