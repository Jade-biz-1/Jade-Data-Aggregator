import os
import csv
import mimetypes
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from backend.core.database import get_db
from backend.core.rbac import require_any_authenticated, require_viewer
from backend.schemas.user import User
from backend.models.file_upload import FileUpload as FileUploadModel

router = APIRouter()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/tmp/data_aggregator/uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _file_record(f: FileUploadModel) -> dict:
    return {
        "id": str(f.id),
        "filename": f.original_filename or f.filename,
        "file_size": f.file_size or 0,
        "file_type": f.mime_type or (str(f.file_type.value) if f.file_type else ""),
        "status": str(f.status.value) if f.status else "unknown",
        "uploaded_at": f.created_at.isoformat() if f.created_at else "",
        "validation_status": "validated" if f.is_validated else "pending",
        "preview_available": (f.file_path and Path(f.file_path).exists()),
    }


@router.get("/uploads")
async def list_uploads(
    limit: int = Query(100, le=500),
    status: Optional[str] = Query(None),
    current_user: User = Depends(require_viewer()),
    db: AsyncSession = Depends(get_db),
):
    """List uploaded files."""
    stmt = select(FileUploadModel).order_by(FileUploadModel.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    files = result.scalars().all()
    return {"uploads": [_file_record(f) for f in files], "total": len(files)}


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(require_any_authenticated()),
    db: AsyncSession = Depends(get_db),
):
    """Upload a file and record it in the database."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    safe_name = Path(file.filename).name
    file_location = os.path.join(UPLOAD_DIR, safe_name)

    content = await file.read()
    with open(file_location, "wb") as f:
        f.write(content)

    mime = mimetypes.guess_type(safe_name)[0] or "application/octet-stream"

    from backend.models.file_upload import FileStatus, FileType
    # Map mime to FileType enum
    ft = FileType.OTHER
    if "csv" in mime or safe_name.endswith(".csv"):
        ft = FileType.CSV
    elif "json" in mime:
        ft = FileType.JSON

    db_file = FileUploadModel(
        filename=safe_name,
        original_filename=file.filename,
        file_path=file_location,
        file_type=ft,
        mime_type=mime,
        file_size=len(content),
        status=FileStatus.COMPLETED,
        is_validated=True,
        upload_completed_at=datetime.utcnow(),
        user_id=current_user.id if hasattr(current_user, 'id') else None,
    )
    db.add(db_file)
    await db.commit()
    await db.refresh(db_file)

    return {"file_path": file_location, "filename": safe_name, "id": str(db_file.id)}


@router.get("/uploads/{file_id}/preview")
async def preview_file(
    file_id: int,
    current_user: User = Depends(require_viewer()),
    db: AsyncSession = Depends(get_db),
):
    """Return a preview of a file's contents."""
    result = await db.execute(select(FileUploadModel).filter(FileUploadModel.id == file_id))
    f = result.scalar_one_or_none()
    if not f:
        raise HTTPException(status_code=404, detail="File not found")

    path = f.file_path
    if not path or not Path(path).exists():
        raise HTTPException(status_code=404, detail="File not found on disk")

    mime = f.mime_type or ""
    if "csv" in mime or path.endswith(".csv"):
        try:
            rows = []
            with open(path, newline="", encoding="utf-8", errors="replace") as fh:
                reader = csv.DictReader(fh)
                columns = reader.fieldnames or []
                for i, row in enumerate(reader):
                    if i >= 20:
                        break
                    rows.append(row)
            return {
                "preview_type": "data",
                "columns": list(columns),
                "data": rows,
                "row_count": len(rows),
                "column_count": len(columns),
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Preview failed: {e}")

    if mime.startswith("text/") or path.endswith(".txt") or path.endswith(".json"):
        with open(path, encoding="utf-8", errors="replace") as fh:
            content = fh.read(4096)
        return {"preview_type": "text", "text_content": content}

    raise HTTPException(status_code=415, detail="Preview not supported for this file type")


@router.get("/uploads/{file_id}/download")
async def download_file(
    file_id: int,
    current_user: User = Depends(require_viewer()),
    db: AsyncSession = Depends(get_db),
):
    """Download a file."""
    result = await db.execute(select(FileUploadModel).filter(FileUploadModel.id == file_id))
    f = result.scalar_one_or_none()
    if not f:
        raise HTTPException(status_code=404, detail="File not found")

    path = f.file_path
    if not path or not Path(path).exists():
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        path=path,
        filename=f.original_filename or f.filename,
        media_type=f.mime_type or "application/octet-stream",
    )


@router.delete("/uploads/{file_id}")
async def delete_file(
    file_id: int,
    current_user: User = Depends(require_any_authenticated()),
    db: AsyncSession = Depends(get_db),
):
    """Delete a file record and its disk file."""
    result = await db.execute(select(FileUploadModel).filter(FileUploadModel.id == file_id))
    f = result.scalar_one_or_none()
    if not f:
        raise HTTPException(status_code=404, detail="File not found")

    # Remove from disk
    if f.file_path and Path(f.file_path).exists():
        try:
            os.remove(f.file_path)
        except OSError:
            pass

    await db.delete(f)
    await db.commit()
    return {"message": "File deleted successfully"}
