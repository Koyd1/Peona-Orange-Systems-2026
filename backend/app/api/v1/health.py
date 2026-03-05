from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/detailed")
async def detailed_health() -> dict[str, str]:
    return {"status": "ok"}
