import os

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from backend.core.rbac import require_any_authenticated
from backend.schemas.user import User

router = APIRouter()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/tmp/data_aggregator/uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(require_any_authenticated())
):
    """
    Upload a file and return its server-side path
    """
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    try:
        with open(file_location, "wb") as f:
            content = await file.read()
            f.write(content)
        return {"file_path": file_location, "filename": file.filename}
    except Exception as e:
        raise safe_error_response(500, "Unable to upload file", internal_error=e)
