from __future__ import annotations

import time
from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends
from openai import AsyncOpenAI
from redis.asyncio import from_url as redis_from_url
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.models import VectorChunk
from app.deps import get_db

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/detailed")
async def detailed_health(db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    openai_data = await _check_openai()
    redis_data = await _check_redis()
    database_data = await _check_database(db)
    hallucination_data = await _check_hallucination_avg(db)

    status = "ok"
    if not openai_data["ok"] or not redis_data["ok"] or not database_data["ok"]:
        status = "error"
    elif (
        openai_data["latencyMs"] > settings.health_openai_warn_ms
        or hallucination_data["avg24h"] > settings.health_hall_warn_threshold
    ):
        status = "warn"

    return {
        "status": status,
        "timestamp": datetime.utcnow().isoformat(),
        "openai": openai_data,
        "redis": redis_data,
        "database": database_data,
        "hallucination": hallucination_data,
    }


async def _check_openai() -> dict[str, Any]:
    if not settings.openai_api_key:
        return {"ok": False, "latencyMs": -1, "detail": "OPENAI_API_KEY is missing"}

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    started = time.perf_counter()
    try:
        await client.embeddings.create(model="text-embedding-3-small", input=["healthcheck"])
        latency_ms = int((time.perf_counter() - started) * 1000)
        return {"ok": True, "latencyMs": latency_ms}
    except Exception as exc:
        latency_ms = int((time.perf_counter() - started) * 1000)
        _ = exc
        return {"ok": False, "latencyMs": latency_ms, "detail": "openai_check_failed"}


async def _check_redis() -> dict[str, Any]:
    started = time.perf_counter()
    client = redis_from_url(settings.redis_url, decode_responses=True)
    try:
        pong = await client.ping()
        latency_ms = int((time.perf_counter() - started) * 1000)
        return {"ok": bool(pong), "latencyMs": latency_ms}
    except Exception as exc:
        latency_ms = int((time.perf_counter() - started) * 1000)
        _ = exc
        return {"ok": False, "latencyMs": latency_ms, "detail": "redis_check_failed"}
    finally:
        await client.aclose()


async def _check_database(db: AsyncSession) -> dict[str, Any]:
    started = time.perf_counter()
    try:
        chunk_count = await db.scalar(select(func.count(VectorChunk.id)))
        latency_ms = int((time.perf_counter() - started) * 1000)
        return {"ok": True, "latencyMs": latency_ms, "chunkCount": int(chunk_count or 0)}
    except Exception as exc:
        latency_ms = int((time.perf_counter() - started) * 1000)
        _ = exc
        return {"ok": False, "latencyMs": latency_ms, "chunkCount": 0, "detail": "database_check_failed"}


async def _check_hallucination_avg(db: AsyncSession) -> dict[str, Any]:
    since = datetime.utcnow() - timedelta(hours=24)
    try:
        row = await db.execute(
            text(
                """
                SELECT COALESCE(AVG(hall_score), 0) AS avg_24h,
                       COUNT(hall_score) AS sample_size
                FROM messages
                WHERE created_at >= :since
                  AND hall_score IS NOT NULL
                """
            ),
            {"since": since},
        )
        avg_24h, sample_size = row.one()
        return {
            "avg24h": round(float(avg_24h or 0), 4),
            "sampleSize": int(sample_size or 0),
        }
    except Exception as exc:
        _ = exc
        return {"avg24h": 0.0, "sampleSize": 0, "detail": "hallucination_aggregation_failed"}
