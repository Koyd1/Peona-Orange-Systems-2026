from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.rag_pipeline import SUPPORTED_EXTENSIONS
from app.db.models import KnowledgeFile, VectorChunk
from app.deps import get_db, ingest_pipeline, storage

router = APIRouter(prefix="/ingest", tags=["ingest"])

MAX_BYTES = settings.ingest_max_file_size_mb * 1024 * 1024


@router.get("")
async def list_ingested_files(db: AsyncSession = Depends(get_db)) -> dict[str, list[dict[str, str | int | None]]]:
    result = await db.scalars(
        select(KnowledgeFile).order_by(KnowledgeFile.created_at.desc()).limit(200)
    )
    files = list(result)

    return {
        "items": [
            {
                "id": file.id,
                "filename": file.filename,
                "size": file.size,
                "status": file.status,
                "chunkCount": file.chunk_count,
                "createdAt": file.created_at.isoformat(),
                "updatedAt": file.updated_at.isoformat(),
            }
            for file in files
        ]
    }


@router.post("", status_code=status.HTTP_202_ACCEPTED)
async def create_ingest_job(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    filename = file.filename or "upload.bin"
    extension = Path(filename).suffix.lower()
    if extension not in SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {extension}")

    payload = await file.read()
    if not payload:
        raise HTTPException(status_code=400, detail="File is empty")
    if len(payload) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="File is too large")

    file_id = str(uuid4())
    object_key = f"knowledge/{file_id}/{filename}"

    storage.upload_bytes(
        object_name=object_key,
        content=payload,
        content_type=file.content_type or "application/octet-stream",
    )

    entity = KnowledgeFile(
        id=file_id,
        filename=filename,
        mime_type=file.content_type or "application/octet-stream",
        size=len(payload),
        storage_path=object_key,
        status="PENDING",
        uploaded_by="system",
    )

    db.add(entity)
    await db.commit()

    background_tasks.add_task(ingest_pipeline.run, file_id)

    return {"fileId": file_id, "status": "PENDING"}


@router.post("/{file_id}/reindex", status_code=status.HTTP_202_ACCEPTED)
async def reindex_knowledge_file(
    file_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    file = await db.scalar(select(KnowledgeFile).where(KnowledgeFile.id == file_id))
    if file is None:
        raise HTTPException(status_code=404, detail="Knowledge file not found")

    file.status = "PENDING"
    file.chunk_count = None
    await db.commit()

    background_tasks.add_task(ingest_pipeline.run, file_id)
    return {"fileId": file.id, "status": file.status}


@router.get("/{file_id}/status")
async def get_ingest_status(file_id: str, db: AsyncSession = Depends(get_db)) -> dict[str, str | int | None]:
    file = await db.scalar(select(KnowledgeFile).where(KnowledgeFile.id == file_id))
    if file is None:
        raise HTTPException(status_code=404, detail="Knowledge file not found")

    return {
        "fileId": file.id,
        "status": file.status,
        "chunkCount": file.chunk_count,
        "updatedAt": file.updated_at.isoformat(),
    }


@router.delete("/{file_id}")
async def delete_knowledge_file(file_id: str, db: AsyncSession = Depends(get_db)) -> dict[str, bool]:
    file = await db.scalar(select(KnowledgeFile).where(KnowledgeFile.id == file_id))
    if file is None:
        raise HTTPException(status_code=404, detail="Knowledge file not found")

    storage.delete_object(file.storage_path)
    await db.execute(delete(VectorChunk).where(VectorChunk.file_id == file_id))
    await db.delete(file)
    await db.commit()

    return {"ok": True}
