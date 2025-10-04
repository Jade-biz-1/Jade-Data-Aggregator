"""
File Upload Models

Models for managing file uploads, processing, and metadata.
Part of Sub-Phase 5A: File Processing
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, BigInteger, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from backend.core.database import Base


class FileStatus(str, enum.Enum):
    """File processing status"""
    UPLOADING = "uploading"
    UPLOADED = "uploaded"
    VALIDATING = "validating"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    DELETED = "deleted"


class FileType(str, enum.Enum):
    """Supported file types"""
    CSV = "csv"
    JSON = "json"
    XML = "xml"
    EXCEL = "excel"
    PARQUET = "parquet"
    TEXT = "text"
    IMAGE = "image"
    PDF = "pdf"
    ARCHIVE = "archive"
    OTHER = "other"


class FileUpload(Base):
    """
    File Upload Model

    Stores metadata for uploaded files including processing status,
    validation results, and file metadata.
    """
    __tablename__ = "file_uploads"

    id = Column(Integer, primary_key=True, index=True)

    # File identification
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(SQLEnum(FileType), nullable=False)
    mime_type = Column(String(100))

    # File properties
    file_size = Column(BigInteger, nullable=False)  # Size in bytes
    file_hash = Column(String(64))  # SHA-256 hash for deduplication
    chunk_count = Column(Integer, default=1)  # Number of chunks for large files

    # Processing status
    status = Column(SQLEnum(FileStatus), default=FileStatus.UPLOADING, nullable=False)
    upload_progress = Column(Integer, default=0)  # Percentage (0-100)

    # Validation
    is_validated = Column(Boolean, default=False)
    validation_errors = Column(JSONB)  # Validation error details
    is_virus_scanned = Column(Boolean, default=False)
    virus_scan_result = Column(String(50))  # "clean", "infected", "error"

    # Metadata
    file_metadata = Column(JSONB)  # Extracted metadata (columns, rows, etc.)
    processing_metadata = Column(JSONB)  # Processing details

    # Ownership and tracking
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    pipeline_id = Column(Integer, ForeignKey("pipelines.id"), nullable=True)

    # Temporary file management
    is_temporary = Column(Boolean, default=True)
    expires_at = Column(DateTime, nullable=True)

    # Timestamps
    upload_started_at = Column(DateTime, default=datetime.utcnow)
    upload_completed_at = Column(DateTime, nullable=True)
    processed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="file_uploads")
    pipeline = relationship("Pipeline", back_populates="file_uploads")
    processing_jobs = relationship("FileProcessingJob", back_populates="file_upload", cascade="all, delete-orphan")
    conversions = relationship("FileConversion", back_populates="source_file", cascade="all, delete-orphan")


class FileProcessingJob(Base):
    """
    File Processing Job Model

    Tracks file processing operations like conversion, preview generation,
    and metadata extraction.
    """
    __tablename__ = "file_processing_jobs"

    id = Column(Integer, primary_key=True, index=True)

    # Job identification
    file_upload_id = Column(Integer, ForeignKey("file_uploads.id"), nullable=False)
    job_type = Column(String(50), nullable=False)  # "conversion", "preview", "metadata", "compression"

    # Job status
    status = Column(String(50), default="pending")  # "pending", "running", "completed", "failed"
    progress = Column(Integer, default=0)  # Percentage (0-100)

    # Job details
    job_config = Column(JSONB)  # Job configuration parameters
    result_data = Column(JSONB)  # Job result details
    error_message = Column(Text, nullable=True)

    # Output files
    output_file_path = Column(String(500), nullable=True)
    output_file_size = Column(BigInteger, nullable=True)

    # Timestamps
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    file_upload = relationship("FileUpload", back_populates="processing_jobs")


class FileConversion(Base):
    """
    File Conversion Model

    Tracks file format conversions (CSV to JSON, Excel to CSV, etc.)
    """
    __tablename__ = "file_conversions"

    id = Column(Integer, primary_key=True, index=True)

    # Conversion details
    source_file_id = Column(Integer, ForeignKey("file_uploads.id"), nullable=False)
    source_format = Column(String(50), nullable=False)
    target_format = Column(String(50), nullable=False)

    # Output file
    output_filename = Column(String(255), nullable=False)
    output_file_path = Column(String(500), nullable=False)
    output_file_size = Column(BigInteger, nullable=False)

    # Conversion status
    status = Column(String(50), default="pending")
    conversion_options = Column(JSONB)  # Conversion parameters
    error_message = Column(Text, nullable=True)

    # Timestamps
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    source_file = relationship("FileUpload", back_populates="conversions")


class FilePreview(Base):
    """
    File Preview Model

    Stores generated preview data for files (first N rows, thumbnails, etc.)
    """
    __tablename__ = "file_previews"

    id = Column(Integer, primary_key=True, index=True)

    # Preview details
    file_upload_id = Column(Integer, ForeignKey("file_uploads.id"), nullable=False)
    preview_type = Column(String(50), nullable=False)  # "data", "image", "text"

    # Preview content
    preview_data = Column(JSONB, nullable=True)  # For data previews (JSON)
    preview_file_path = Column(String(500), nullable=True)  # For image/file previews
    preview_text = Column(Text, nullable=True)  # For text previews

    # Preview configuration
    row_limit = Column(Integer, nullable=True)  # Number of rows in preview
    column_limit = Column(Integer, nullable=True)  # Number of columns in preview

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    file_upload = relationship("FileUpload")
