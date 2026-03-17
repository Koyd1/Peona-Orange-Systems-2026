from __future__ import annotations

import logging
import time
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends
from openai import AsyncOpenAI
from redis.asyncio import from_url as redis_from_url
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.pricing import calculate_costs, parse_model_pricing
from app.core.token_estimation import estimate_legacy_chat_usage
from app.db.models import VectorChunk
from app.deps import get_db

router = APIRouter(prefix="/health", tags=["health"])
LOGGER = logging.getLogger(__name__)

WINDOWS: dict[str, timedelta] = {
    "24h": timedelta(hours=24),
    "7d": timedelta(days=7),
    "30d": timedelta(days=30),
}


@router.get("/detailed")
async def detailed_health(db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    openai_data = await _check_openai()
    redis_data = await _check_redis()
    database_data = await _check_database(db)
    analytics = await _build_analytics(db)

    services_status = _section_status(all([openai_data["ok"], redis_data["ok"], database_data["ok"]]), warn=False)
    usage_status = "warn" if analytics["coverage"]["missingPricingModels"] else "ok"
    quality_status = (
        "warn"
        if analytics["quality"]["windows"]["24h"]["avgHallScore"] > settings.health_hall_warn_threshold
        else "ok"
    )
    coverage_status = (
        "warn"
        if analytics["coverage"]["judgeCoverage30d"]["coveragePct"] < 70
        or analytics["coverage"]["telemetryCoverage30d"]["coveragePct"] < 70
        or analytics["coverage"]["missingPricingModels"]
        else "ok"
    )

    status = "ok"
    if services_status == "error":
        status = "error"
    elif (
        openai_data["latencyMs"] > settings.health_openai_warn_ms
        or usage_status == "warn"
        or quality_status == "warn"
        or coverage_status == "warn"
    ):
        status = "warn"

    return {
        "status": status,
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "status": services_status,
            "openai": openai_data,
            "redis": redis_data,
            "database": database_data,
        },
        "usage": {
            "status": usage_status,
            **analytics["usage"],
        },
        "quality": {
            "status": quality_status,
            **analytics["quality"],
        },
        "coverage": {
            "status": coverage_status,
            **analytics["coverage"],
        },
    }


def _section_status(ok: bool, *, warn: bool) -> str:
    if not ok:
        return "error"
    return "warn" if warn else "ok"


async def _check_openai() -> dict[str, Any]:
    if not settings.openai_api_key:
        return {"ok": False, "latencyMs": -1, "detail": "OPENAI_API_KEY is missing"}

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    started = time.perf_counter()
    try:
        await client.embeddings.create(
            model=settings.openai_embedding_model,
            input=["healthcheck"],
            dimensions=settings.openai_embedding_dim,
        )
        latency_ms = int((time.perf_counter() - started) * 1000)
        return {"ok": True, "latencyMs": latency_ms, "model": settings.openai_embedding_model}
    except Exception as exc:
        latency_ms = int((time.perf_counter() - started) * 1000)
        LOGGER.warning("health.openai_check_failed", extra={"latency_ms": latency_ms, "error": str(exc)})
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
        LOGGER.warning("health.redis_check_failed", extra={"latency_ms": latency_ms, "error": str(exc)})
        return {"ok": False, "latencyMs": latency_ms, "detail": "redis_check_failed"}
    finally:
        await client.aclose()


async def _check_database(db: AsyncSession) -> dict[str, Any]:
    started = time.perf_counter()
    try:
        chunk_count = await db.scalar(select(func.count(VectorChunk.id)))
        message_count = await db.execute(text("SELECT COUNT(*) AS count FROM messages"))
        latency_ms = int((time.perf_counter() - started) * 1000)
        return {
            "ok": True,
            "latencyMs": latency_ms,
            "chunkCount": int(chunk_count or 0),
            "messageCount": int(message_count.scalar() or 0),
        }
    except Exception as exc:
        latency_ms = int((time.perf_counter() - started) * 1000)
        LOGGER.warning("health.database_check_failed", extra={"latency_ms": latency_ms, "error": str(exc)})
        return {
            "ok": False,
            "latencyMs": latency_ms,
            "chunkCount": 0,
            "messageCount": 0,
            "detail": "database_check_failed",
        }


async def _build_analytics(db: AsyncSession) -> dict[str, Any]:
    since_30d = datetime.utcnow() - WINDOWS["30d"]
    pricing = parse_model_pricing(settings.openai_model_pricing_json)

    usage_rows = (await db.execute(
        text(
            """
            SELECT
              id,
              session_id,
              message_id,
              operation,
              model,
              provider,
              usage_source,
              prompt_tokens,
              completion_tokens,
              total_tokens,
              latency_ms,
              cost_input_usd,
              cost_output_usd,
              cost_total_usd,
              status,
              error_code,
              created_at
            FROM ai_usage_events
            WHERE created_at >= :since_30d
            ORDER BY created_at ASC
            """
        ),
        {"since_30d": since_30d},
    )).mappings().all()

    assistant_rows = (await db.execute(
        text(
            """
            SELECT
              m.id,
              m.session_id,
              m.content,
              m.sources,
              m.hall_score,
              m.hall_reason,
              m.hall_judge_model,
              m.hall_score_source,
              m.hall_evaluated_at,
              m.created_at,
              fb.rating AS feedback_rating,
              prev_user.content AS user_content,
              EXISTS (
                SELECT 1
                FROM ai_usage_events aue
                WHERE aue.message_id = m.id
                  AND aue.operation = 'chat'
                  AND aue.usage_source = 'exact'
              ) AS has_exact_chat_usage
            FROM messages m
            LEFT JOIN feedbacks fb
              ON fb.message_id = m.id
            LEFT JOIN LATERAL (
              SELECT content
              FROM messages prev
              WHERE prev.session_id = m.session_id
                AND prev.role = 'user'
                AND prev.created_at <= m.created_at
              ORDER BY prev.created_at DESC
              LIMIT 1
            ) AS prev_user ON TRUE
            WHERE m.role = 'assistant'
              AND m.created_at >= :since_30d
            ORDER BY m.created_at ASC
            """
        ),
        {"since_30d": since_30d},
    )).mappings().all()

    exact_events: list[dict[str, Any]] = [dict(row) for row in usage_rows]
    legacy_events = _build_legacy_events(assistant_rows, pricing)
    usage = _summarize_usage(exact_events, legacy_events)
    quality = _summarize_quality(assistant_rows, exact_events)
    coverage = _summarize_coverage(assistant_rows, exact_events, legacy_events)

    return {
        "usage": usage,
        "quality": quality,
        "coverage": coverage,
    }


def _build_legacy_events(
    assistant_rows: list[Any],
    pricing: dict[str, Any],
) -> list[dict[str, Any]]:
    events: list[dict[str, Any]] = []

    for row in assistant_rows:
        if row["has_exact_chat_usage"]:
            continue
        user_content = row["user_content"]
        if not isinstance(user_content, str) or not user_content.strip():
            continue

        estimated_tokens = estimate_legacy_chat_usage(
            model=settings.openai_chat_model,
            user_message=user_content,
            assistant_message=str(row["content"] or ""),
            sources=row["sources"],
        )
        cost = calculate_costs(
            pricing,
            model=settings.openai_chat_model,
            prompt_tokens=estimated_tokens["prompt_tokens"],
            completion_tokens=estimated_tokens["completion_tokens"],
        )
        events.append(
            {
                "id": f"legacy:{row['id']}",
                "session_id": row["session_id"],
                "message_id": row["id"],
                "operation": "chat",
                "model": settings.openai_chat_model,
                "provider": "openai",
                "usage_source": "estimated_legacy",
                "prompt_tokens": estimated_tokens["prompt_tokens"],
                "completion_tokens": estimated_tokens["completion_tokens"],
                "total_tokens": estimated_tokens["total_tokens"],
                "latency_ms": None,
                "cost_input_usd": cost["cost_input_usd"],
                "cost_output_usd": cost["cost_output_usd"],
                "cost_total_usd": cost["cost_total_usd"],
                "status": "estimated",
                "error_code": None,
                "created_at": row["created_at"],
            }
        )

    return events


def _summarize_usage(exact_events: list[dict[str, Any]], legacy_events: list[dict[str, Any]]) -> dict[str, Any]:
    all_events = [*exact_events, *legacy_events]
    now = datetime.utcnow()

    windows = {
        label: _usage_window_summary(
            [event for event in all_events if _within_window(event["created_at"], now, delta)]
        )
        for label, delta in WINDOWS.items()
    }

    trends_by_day: dict[str, dict[str, Any]] = defaultdict(
        lambda: {
            "day": "",
            "exactTokens": 0,
            "estimatedTokens": 0,
            "exactSpendUsd": 0.0,
            "estimatedSpendUsd": 0.0,
            "requests": 0,
        }
    )
    for event in all_events:
        day = _day_key(event["created_at"])
        point = trends_by_day[day]
        point["day"] = day
        point["requests"] += 1
        if event["usage_source"] == "estimated_legacy":
            point["estimatedTokens"] += int(event["total_tokens"] or 0)
            point["estimatedSpendUsd"] += float(event["cost_total_usd"] or 0)
        else:
            point["exactTokens"] += int(event["total_tokens"] or 0)
            point["exactSpendUsd"] += float(event["cost_total_usd"] or 0)

    operations_30d = _group_usage(exact_events, legacy_events, "operation")
    models_30d = _group_usage(exact_events, legacy_events, "model", include_operation=True)

    return {
        "windows": windows,
        "trends30d": sorted(trends_by_day.values(), key=lambda item: item["day"]),
        "operations30d": operations_30d,
        "models30d": models_30d,
    }


def _usage_window_summary(events: list[dict[str, Any]]) -> dict[str, Any]:
    exact = [event for event in events if event["usage_source"] != "estimated_legacy"]
    estimated = [event for event in events if event["usage_source"] == "estimated_legacy"]

    def summarize(bucket: list[dict[str, Any]]) -> dict[str, Any]:
        requests = len(bucket)
        avg_latency_values = [float(event["latency_ms"]) for event in bucket if event["latency_ms"] is not None]
        return {
            "requests": requests,
            "promptTokens": sum(int(event["prompt_tokens"] or 0) for event in bucket),
            "completionTokens": sum(int(event["completion_tokens"] or 0) for event in bucket),
            "totalTokens": sum(int(event["total_tokens"] or 0) for event in bucket),
            "spendUsd": round(sum(float(event["cost_total_usd"] or 0) for event in bucket), 6),
            "avgLatencyMs": round(sum(avg_latency_values) / len(avg_latency_values), 1) if avg_latency_values else None,
        }

    exact_summary = summarize(exact)
    estimated_summary = summarize(estimated)

    return {
        "exact": exact_summary,
        "estimatedLegacy": estimated_summary,
        "combined": {
            "requests": exact_summary["requests"] + estimated_summary["requests"],
            "promptTokens": exact_summary["promptTokens"] + estimated_summary["promptTokens"],
            "completionTokens": exact_summary["completionTokens"] + estimated_summary["completionTokens"],
            "totalTokens": exact_summary["totalTokens"] + estimated_summary["totalTokens"],
            "spendUsd": round(exact_summary["spendUsd"] + estimated_summary["spendUsd"], 6),
        },
    }


def _group_usage(
    exact_events: list[dict[str, Any]],
    legacy_events: list[dict[str, Any]],
    primary_key: str,
    *,
    include_operation: bool = False,
) -> list[dict[str, Any]]:
    grouped: dict[tuple[str, str] | str, dict[str, Any]] = {}

    for event in [*exact_events, *legacy_events]:
        key: tuple[str, str] | str
        if include_operation:
            key = (str(event[primary_key]), str(event["operation"]))
        else:
            key = str(event[primary_key])

        item = grouped.setdefault(
            key,
            {
                primary_key: str(event[primary_key]),
                "operation": str(event["operation"]),
                "requests": 0,
                "exactTokens": 0,
                "estimatedTokens": 0,
                "costTotalUsd": 0.0,
                "avgLatencyMsValues": [],
                "missingPricing": False,
            },
        )
        item["requests"] += 1
        if event["usage_source"] == "estimated_legacy":
            item["estimatedTokens"] += int(event["total_tokens"] or 0)
        else:
            item["exactTokens"] += int(event["total_tokens"] or 0)
        item["costTotalUsd"] += float(event["cost_total_usd"] or 0)
        if event["cost_total_usd"] is None:
            item["missingPricing"] = True
        if event["latency_ms"] is not None:
            item["avgLatencyMsValues"].append(float(event["latency_ms"]))

    rows = []
    for item in grouped.values():
        latencies = item.pop("avgLatencyMsValues")
        rows.append(
            {
                **item,
                "totalTokens": item["exactTokens"] + item["estimatedTokens"],
                "costTotalUsd": round(float(item["costTotalUsd"]), 6),
                "avgLatencyMs": round(sum(latencies) / len(latencies), 1) if latencies else None,
            }
        )

    return sorted(rows, key=lambda row: (-row["totalTokens"], row[primary_key]))


def _summarize_quality(assistant_rows: list[Any], exact_events: list[dict[str, Any]]) -> dict[str, Any]:
    now = datetime.utcnow()

    windows = {
        label: _quality_window_summary(
            [row for row in assistant_rows if _within_window(row["created_at"], now, delta)]
        )
        for label, delta in WINDOWS.items()
    }

    trends_by_day: dict[str, list[Any]] = defaultdict(list)
    for row in assistant_rows:
        trends_by_day[_day_key(row["created_at"])].append(row)

    trends = []
    for day, items in sorted(trends_by_day.items()):
        scores = [float(row["hall_score"]) for row in items if row["hall_score"] is not None]
        trends.append(
            {
                "day": day,
                "avgHallScore": round(sum(scores) / len(scores), 4) if scores else 0.0,
                "p95HallScore": _percentile(scores, 95),
                "maxHallScore": round(max(scores), 4) if scores else 0.0,
                "judgedSamples": sum(1 for row in items if row["hall_score_source"] == "judge"),
                "heuristicSamples": sum(
                    1
                    for row in items
                    if row["hall_score_source"] in {"heuristic", "pending"} or row["hall_score_source"] is None
                ),
                "highRiskCount": sum(
                    1 for row in items if row["hall_score"] is not None and float(row["hall_score"]) >= 0.7
                ),
                "negativeFeedbackCount": sum(1 for row in items if row["feedback_rating"] == -1),
            }
        )

    reasons: dict[str, int] = defaultdict(int)
    risk_buckets = {"low": 0, "moderate": 0, "elevated": 0, "high": 0}
    exact_chat_models = {
        row["message_id"]: row["model"]
        for row in exact_events
        if row["message_id"] is not None and row["operation"] == "chat" and row["usage_source"] == "exact"
    }
    risky_answers = []

    for row in sorted(assistant_rows, key=lambda item: (float(item["hall_score"] or 0), item["created_at"]), reverse=True):
        score = float(row["hall_score"] or 0)
        reason = str(row["hall_reason"] or "unknown")
        reasons[reason] += 1
        risk_buckets[_risk_bucket(score)] += 1
        if score >= 0.85 and len(risky_answers) < 12:
            risky_answers.append(
                {
                    "messageId": row["id"],
                    "sessionId": row["session_id"],
                    "createdAt": row["created_at"].isoformat(),
                    "model": exact_chat_models.get(row["id"], settings.openai_chat_model),
                    "hallScore": round(score, 4),
                    "hallReason": reason,
                    "hallScoreSource": row["hall_score_source"] or "heuristic",
                    "feedbackRating": row["feedback_rating"],
                    "answerExcerpt": str(row["content"] or "")[:240],
                }
            )

    return {
        "windows": windows,
        "trends30d": trends,
        "reasonBreakdown30d": [
            {"reason": reason, "count": count}
            for reason, count in sorted(reasons.items(), key=lambda item: (-item[1], item[0]))
            if reason and reason != "unknown"
        ],
        "riskBuckets30d": [{"bucket": bucket, "count": count} for bucket, count in risk_buckets.items()],
        "riskyAnswers": risky_answers,
    }


def _quality_window_summary(rows: list[Any]) -> dict[str, Any]:
    scores = [float(row["hall_score"]) for row in rows if row["hall_score"] is not None]
    high_risk = [row for row in rows if row["hall_score"] is not None and float(row["hall_score"]) >= 0.85]
    negative_feedback_overlap = [
        row
        for row in rows
        if row["feedback_rating"] == -1
        and row["hall_score"] is not None
        and float(row["hall_score"]) >= settings.health_hall_warn_threshold
    ]
    return {
        "messages": len(rows),
        "avgHallScore": round(sum(scores) / len(scores), 4) if scores else 0.0,
        "p95HallScore": _percentile(scores, 95),
        "judgedSamples": sum(1 for row in rows if row["hall_score_source"] == "judge"),
        "heuristicSamples": sum(
            1
            for row in rows
            if row["hall_score_source"] in {"heuristic", "pending"} or row["hall_score_source"] is None
        ),
        "highRiskCount": len(high_risk),
        "negativeFeedbackOverlapCount": len(negative_feedback_overlap),
    }


def _summarize_coverage(
    assistant_rows: list[Any],
    exact_events: list[dict[str, Any]],
    legacy_events: list[dict[str, Any]],
) -> dict[str, Any]:
    assistant_count = len(assistant_rows)
    exact_chat_message_ids = {
        str(event["message_id"])
        for event in exact_events
        if event["message_id"] is not None and event["operation"] == "chat" and event["usage_source"] == "exact"
    }
    judged_message_ids = {
        str(row["id"])
        for row in assistant_rows
        if row["hall_score_source"] == "judge"
    }
    missing_pricing_models = sorted(
        {
            str(event["model"])
            for event in [*exact_events, *legacy_events]
            if event["cost_total_usd"] is None
        }
    )
    last_exact_event = max(
        (event["created_at"] for event in exact_events if event["usage_source"] == "exact"),
        default=None,
    )

    telemetry_covered = len(exact_chat_message_ids)
    judge_covered = len(judged_message_ids)
    legacy_estimated = len({str(event["message_id"]) for event in legacy_events})

    return {
        "telemetryCoverage30d": {
            "assistantMessages": assistant_count,
            "withExactUsage": telemetry_covered,
            "withoutUsage": max(assistant_count - telemetry_covered, 0),
            "coveragePct": round((telemetry_covered / assistant_count) * 100, 2) if assistant_count else 100.0,
        },
        "judgeCoverage30d": {
            "assistantMessages": assistant_count,
            "judged": judge_covered,
            "heuristicOnly": max(assistant_count - judge_covered, 0),
            "coveragePct": round((judge_covered / assistant_count) * 100, 2) if assistant_count else 100.0,
        },
        "missingPricingModels": missing_pricing_models,
        "lastExactUsageEventAt": last_exact_event.isoformat() if last_exact_event else None,
        "legacyEstimateMessages30d": legacy_estimated,
    }


def _within_window(created_at: datetime, now: datetime, delta: timedelta) -> bool:
    return created_at >= now - delta


def _day_key(value: datetime) -> str:
    return value.date().isoformat()


def _percentile(values: list[float], percentile: int) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    index = max(0, min(len(ordered) - 1, round(((percentile / 100) * (len(ordered) - 1)))))
    return round(ordered[index], 4)


def _risk_bucket(score: float) -> str:
    if score >= 0.85:
        return "high"
    if score >= 0.65:
        return "elevated"
    if score >= 0.2:
        return "moderate"
    return "low"
