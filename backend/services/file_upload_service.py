"""
File Upload Service

Handles chunked file uploads, file validation, and temporary file management.
Part of Sub-Phase 5A: File Processing (B014)
"""

import os
import hashlib
import aiofiles
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from backend.models.file_upload import (
    FileUpload,
    FileStatus,
    FileType
)


class FileUploadService:
    """Service for handling file uploads with chunking support"""

    # Configuration
    UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/tmp/data_aggregator/uploads")
    TEMP_DIR = os.getenv("TEMP_DIR", "/tmp/data_aggregator/temp")
    MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", 5 * 1024 * 1024 * 1024))  # 5GB default
    CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", 5 * 1024 * 1024))  # 5MB chunks
    TEMP_FILE_EXPIRY_HOURS = int(os.getenv("TEMP_FILE_EXPIRY_HOURS", 24))

    def __init__(self):
        """Initialize upload directories"""
        os.makedirs(self.UPLOAD_DIR, exist_ok=True)
        os.makedirs(self.TEMP_DIR, exist_ok=True)

    @staticmethod
    def _detect_file_type(filename: str, mime_type: Optional[str] = None) -> FileType:
        """Detect file type from filename and mime type"""
        ext = Path(filename).suffix.lower()

        type_mapping = {
            ".csv": FileType.CSV,
            ".json": FileType.JSON,
            ".xml": FileType.XML,
            ".xlsx": FileType.EXCEL,
            ".xls": FileType.EXCEL,
            ".parquet": FileType.PARQUET,
            ".txt": FileType.TEXT,
            ".log": FileType.TEXT,
            ".png": FileType.IMAGE,
            ".jpg": FileType.IMAGE,
            ".jpeg": FileType.IMAGE,
            ".gif": FileType.IMAGE,
            ".pdf": FileType.PDF,
            ".zip": FileType.ARCHIVE,
            ".tar": FileType.ARCHIVE,
            ".gz": FileType.ARCHIVE,
            ".7z": FileType.ARCHIVE,
        }

        return type_mapping.get(ext, FileType.OTHER)

    @staticmethod
    async def _calculate_file_hash(file_path: str) -> str:
        """Calculate SHA-256 hash of file"""
        sha256_hash = hashlib.sha256()

        async with aiofiles.open(file_path, "rb") as f:
            while chunk := await f.read(8192):
                sha256_hash.update(chunk)

        return sha256_hash.hexdigest()

    async def create_upload(
        self,
        db: AsyncSession,
        filename: str,
        file_size: int,
        mime_type: Optional[str] = None,
        user_id: Optional[int] = None,
        pipeline_id: Optional[int] = None,
        is_temporary: bool = True,
        metadata: Optional[Dict[str, Any]] = None
    ) -> FileUpload:
        """
        Create a new file upload record

        Args:
            db: Database session
            filename: Original filename
            file_size: File size in bytes
            mime_type: MIME type of file
            user_id: User ID who uploaded the file
            pipeline_id: Associated pipeline ID
            is_temporary: Whether file is temporary
            metadata: Additional metadata

        Returns:
            FileUpload record
        """
        # Generate unique filename
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        unique_filename = f"{timestamp}_{filename}"

        # Determine file path
        file_path = os.path.join(self.UPLOAD_DIR, unique_filename)

        # Detect file type
        file_type = self._detect_file_type(filename, mime_type)

        # Calculate expiry for temporary files
        expires_at = None
        if is_temporary:
            expires_at = datetime.utcnow() + timedelta(hours=self.TEMP_FILE_EXPIRY_HOURS)

        # Create file upload record
        file_upload = FileUpload(
            filename=unique_filename,
            original_filename=filename,
            file_path=file_path,
            file_type=file_type,
            mime_type=mime_type,
            file_size=file_size,
            status=FileStatus.UPLOADING,
            user_id=user_id,
            pipeline_id=pipeline_id,
            is_temporary=is_temporary,
            expires_at=expires_at,
            file_metadata=metadata or {}
        )

        db.add(file_upload)
        await db.commit()
        await db.refresh(file_upload)

        return file_upload

    async def upload_chunk(
        self,
        db: AsyncSession,
        file_id: int,
        chunk_data: bytes,
        chunk_number: int,
        total_chunks: int,
        append: bool = True
    ) -> Dict[str, Any]:
        """
        Upload a file chunk

        Args:
            db: Database session
            file_id: File upload ID
            chunk_data: Chunk data bytes
            chunk_number: Current chunk number (0-indexed)
            total_chunks: Total number of chunks
            append: Whether to append or overwrite

        Returns:
            Upload status dict
        """
        # Get file upload record
        result = await db.execute(select(FileUpload).where(FileUpload.id == file_id))
        file_upload = result.scalar_one_or_none()

        if not file_upload:
            raise ValueError(f"File upload {file_id} not found")

        if file_upload.status == FileStatus.COMPLETED:
            raise ValueError("File upload already completed")

        # Write chunk to file
        mode = "ab" if append else "wb"
        async with aiofiles.open(file_upload.file_path, mode) as f:
            await f.write(chunk_data)

        # Update progress
        progress = int(((chunk_number + 1) / total_chunks) * 100)
        file_upload.upload_progress = progress
        file_upload.chunk_count = total_chunks

        # Check if upload is complete
        if chunk_number + 1 == total_chunks:
            file_upload.status = FileStatus.UPLOADED
            file_upload.upload_completed_at = datetime.utcnow()

            # Calculate file hash
            file_hash = await self._calculate_file_hash(file_upload.file_path)
            file_upload.file_hash = file_hash

        await db.commit()
        await db.refresh(file_upload)

        return {
            "file_id": file_upload.id,
            "status": file_upload.status.value,
            "progress": file_upload.upload_progress,
            "chunk_number": chunk_number,
            "total_chunks": total_chunks,
            "completed": file_upload.status == FileStatus.COMPLETED
        }

    async def upload_complete_file(
        self,
        db: AsyncSession,
        filename: str,
        file_data: bytes,
        mime_type: Optional[str] = None,
        user_id: Optional[int] = None,
        pipeline_id: Optional[int] = None,
        is_temporary: bool = True,
        metadata: Optional[Dict[str, Any]] = None
    ) -> FileUpload:
        """
        Upload a complete file (non-chunked)

        Args:
            db: Database session
            filename: Original filename
            file_data: Complete file data
            mime_type: MIME type
            user_id: User ID
            pipeline_id: Pipeline ID
            is_temporary: Whether file is temporary
            metadata: Additional metadata

        Returns:
            FileUpload record
        """
        file_size = len(file_data)

        # Create upload record
        file_upload = await self.create_upload(
            db=db,
            filename=filename,
            file_size=file_size,
            mime_type=mime_type,
            user_id=user_id,
            pipeline_id=pipeline_id,
            is_temporary=is_temporary,
            metadata=metadata
        )

        # Write file
        async with aiofiles.open(file_upload.file_path, "wb") as f:
            await f.write(file_data)

        # Update status
        file_upload.status = FileStatus.UPLOADED
        file_upload.upload_progress = 100
        file_upload.upload_completed_at = datetime.utcnow()

        # Calculate hash
        file_hash = await self._calculate_file_hash(file_upload.file_path)
        file_upload.file_hash = file_hash

        await db.commit()
        await db.refresh(file_upload)

        return file_upload

    async def get_file_upload(
        self,
        db: AsyncSession,
        file_id: int
    ) -> Optional[FileUpload]:
        """Get file upload by ID"""
        result = await db.execute(select(FileUpload).where(FileUpload.id == file_id))
        return result.scalar_one_or_none()

    async def list_file_uploads(
        self,
        db: AsyncSession,
        user_id: Optional[int] = None,
        pipeline_id: Optional[int] = None,
        status: Optional[FileStatus] = None,
        file_type: Optional[FileType] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[FileUpload]:
        """List file uploads with filters"""
        query = select(FileUpload)

        conditions = []
        if user_id is not None:
            conditions.append(FileUpload.user_id == user_id)
        if pipeline_id is not None:
            conditions.append(FileUpload.pipeline_id == pipeline_id)
        if status is not None:
            conditions.append(FileUpload.status == status)
        if file_type is not None:
            conditions.append(FileUpload.file_type == file_type)

        if conditions:
            query = query.where(and_(*conditions))

        query = query.offset(skip).limit(limit).order_by(FileUpload.created_at.desc())

        result = await db.execute(query)
        return list(result.scalars().all())

    async def update_upload_status(
        self,
        db: AsyncSession,
        file_id: int,
        status: FileStatus,
        error_message: Optional[str] = None
    ) -> Optional[FileUpload]:
        """Update file upload status"""
        result = await db.execute(select(FileUpload).where(FileUpload.id == file_id))
        file_upload = result.scalar_one_or_none()

        if not file_upload:
            return None

        file_upload.status = status

        if status == FileStatus.COMPLETED:
            file_upload.processed_at = datetime.utcnow()
        elif status == FileStatus.FAILED and error_message:
            file_upload.validation_errors = {"error": error_message}

        await db.commit()
        await db.refresh(file_upload)

        return file_upload

    async def delete_file(
        self,
        db: AsyncSession,
        file_id: int,
        remove_physical_file: bool = True
    ) -> bool:
        """
        Delete file upload

        Args:
            db: Database session
            file_id: File upload ID
            remove_physical_file: Whether to delete physical file

        Returns:
            True if deleted successfully
        """
        result = await db.execute(select(FileUpload).where(FileUpload.id == file_id))
        file_upload = result.scalar_one_or_none()

        if not file_upload:
            return False

        # Delete physical file
        if remove_physical_file and os.path.exists(file_upload.file_path):
            try:
                os.remove(file_upload.file_path)
            except Exception as e:
                print(f"Error deleting physical file: {e}")

        # Mark as deleted
        file_upload.status = FileStatus.DELETED

        await db.delete(file_upload)
        await db.commit()

        return True

    async def cleanup_expired_files(
        self,
        db: AsyncSession
    ) -> int:
        """
        Clean up expired temporary files

        Returns:
            Number of files cleaned up
        """
        now = datetime.utcnow()

        # Find expired files
        result = await db.execute(
            select(FileUpload).where(
                and_(
                    FileUpload.is_temporary == True,
                    FileUpload.expires_at < now,
                    FileUpload.status != FileStatus.DELETED
                )
            )
        )
        expired_files = list(result.scalars().all())

        count = 0
        for file_upload in expired_files:
            # Delete physical file
            if os.path.exists(file_upload.file_path):
                try:
                    os.remove(file_upload.file_path)
                    count += 1
                except Exception as e:
                    print(f"Error deleting expired file {file_upload.id}: {e}")

            # Mark as deleted
            file_upload.status = FileStatus.DELETED
            await db.delete(file_upload)

        await db.commit()
        return count

    async def get_file_content(
        self,
        db: AsyncSession,
        file_id: int,
        offset: int = 0,
        length: Optional[int] = None
    ) -> Optional[bytes]:
        """
        Read file content

        Args:
            db: Database session
            file_id: File upload ID
            offset: Byte offset to start reading
            length: Number of bytes to read (None for entire file)

        Returns:
            File content bytes
        """
        result = await db.execute(select(FileUpload).where(FileUpload.id == file_id))
        file_upload = result.scalar_one_or_none()

        if not file_upload or not os.path.exists(file_upload.file_path):
            return None

        async with aiofiles.open(file_upload.file_path, "rb") as f:
            if offset > 0:
                await f.seek(offset)

            if length:
                return await f.read(length)
            else:
                return await f.read()

    async def check_duplicate(
        self,
        db: AsyncSession,
        file_hash: str
    ) -> Optional[FileUpload]:
        """Check if file with same hash exists"""
        result = await db.execute(
            select(FileUpload).where(
                and_(
                    FileUpload.file_hash == file_hash,
                    FileUpload.status != FileStatus.DELETED
                )
            ).order_by(FileUpload.created_at.desc())
        )
        return result.scalar_one_or_none()
