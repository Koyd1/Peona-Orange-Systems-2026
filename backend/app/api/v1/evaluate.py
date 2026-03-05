from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/evaluate", tags=["evaluate"])


class EvaluateRequest(BaseModel):
    answer: str


@router.post("")
async def evaluate(request: EvaluateRequest) -> dict[str, float]:
    _ = request
    return {"hallScore": 0.0}
