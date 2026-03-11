from __future__ import annotations

from enum import unique
import math
import logging
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

# from app.core.snippet import extract_relevant_snippet
# from app.core.snippet import query_overlap_score

from app.core.hallucination import score_hallucination
from app.core.streamer import encode_sse
from app.db.models import KnowledgeFile
from app.deps import chat_streamer, embedder, get_db, retriever

router = APIRouter(prefix="/chat", tags=["chat"])
LOGGER = logging.getLogger(__name__)


class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str = Field(min_length=1, max_length=6000)


class ChatRequest(BaseModel):
    session_id: str = Field(min_length=3, max_length=128)
    messages: list[ChatMessage] = Field(min_length=1, max_length=50)


@router.post("")
async def chat(request: ChatRequest, db: AsyncSession = Depends(get_db)) -> StreamingResponse:
    last_user = next((msg for msg in reversed(request.messages) if msg.role == "user"), None)
    if last_user is None:
        raise HTTPException(status_code=400, detail="At least one user message is required")

    LOGGER.info(
        "chat.request_received",
        extra={"session_id": request.session_id, "messages_count": len(request.messages)},
    )

    query_embedding = (await embedder.embed_texts([last_user.content]))[0]
    sources = await retriever.retrieve(db, query_embedding)
#     sources = sorted(
#     sources,
#     key=lambda s: (
#         s.similarity,
#         query_overlap_score(s.content, last_user.content)
#     ),
#     reverse=True
# )
    LOGGER.info(
        "chat.sources_retrieved",
        extra={"session_id": request.session_id, "sources_count": len(sources)},
    )

    async def event_generator(sources=sources):
        files_map: dict[str, str] = {}
        if sources:
            file_ids = list({source.file_id for source in sources})
            from sqlalchemy import select
            unique = {}
            for source in sources:
                key = (source.file_id, source.content[:80])
                if key not in unique:
                    unique[key] = source
            sources = list(unique.values())
            result = await db.execute(
                select(KnowledgeFile.id, KnowledgeFile.filename).where(KnowledgeFile.id.in_(file_ids))
            )
            files_map = {str(row[0]): str(row[1]) for row in result.all()}

        sources_payload = [
            {
                "fileId": source.file_id,
                "filename": files_map.get(source.file_id, "unknown"),
                "similarity": round(source.similarity, 4)
                if isinstance(source.similarity, float) and math.isfinite(source.similarity)
                else 0.0,
                "snippet": source.content[:220],
            }
            for source in sources
        ]
        yield encode_sse({"type": "sources", "data": sources_payload})

        context_blocks = [source.content for source in sources]
        if not context_blocks:
            LOGGER.info("chat.no_context", extra={"session_id": request.session_id})
            answer = (
                "В базе знаний пока нет релевантной информации по этому вопросу. "
                "Загрузите HR-документы в раздел Knowledge и повторите запрос."
            )
            yield encode_sse(
                {
                    "type": "done",
                    "data": {
                        "answer": answer,
                        "session_id": request.session_id,
                        "hallScore": 0.0,
                    },
                }
            )
            return

        full_answer_parts: list[str] = []
        async for token in chat_streamer.stream_answer(
            user_message=last_user.content,
            context_blocks=context_blocks,
        ):
            full_answer_parts.append(token)
            yield encode_sse({"type": "token", "data": token})

        final_answer = "".join(full_answer_parts).strip()
        hall_score = score_hallucination(final_answer, context_blocks)
        LOGGER.info(
            "chat.completed",
            extra={
                "session_id": request.session_id,
                "answer_len": len(final_answer),
                "hall_score": round(hall_score, 4),
            },
        )
        yield encode_sse(
            {
                "type": "done",
                "data": {
                    "answer": final_answer,
                    "session_id": request.session_id,
                    "hallScore": hall_score,
                },
            }
        )

    return StreamingResponse(event_generator(), media_type="text/event-stream")
