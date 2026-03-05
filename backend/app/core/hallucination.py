from __future__ import annotations


def score_hallucination(answer: str, context_blocks: list[str]) -> float:
    if not answer.strip():
        return 1.0
    if not context_blocks:
        return 0.8
    return 0.1
