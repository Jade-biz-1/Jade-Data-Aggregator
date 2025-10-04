"""
File Validation and Virus Scanning Service

Handles file validation, virus scanning, and content verification.
Part of Sub-Phase 5A: File Processing (B014)
"""

import os
import magic
import chardet
from typing import Optional, Dict, Any, List
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.models.file_upload import FileUpload, FileStatus, FileType


class FileValidationService:
    """Service for validating uploaded files"""

    # File size limits by type (in bytes)
    FILE_SIZE_LIMITS = {
        FileType.CSV: 2 * 1024 * 1024 * 1024,  # 2GB
        FileType.JSON: 500 * 1024 * 1024,  # 500MB
        FileType.EXCEL: 100 * 1024 * 1024,  # 100MB
        FileType.IMAGE: 50 * 1024 * 1024,  # 50MB
        FileType.PDF: 100 * 1024 * 1024,  # 100MB
        FileType.ARCHIVE: 1 * 1024 * 1024 * 1024,  # 1GB
    }

    # Allowed MIME types
    ALLOWED_MIME_TYPES = {
        # Text/Data files
        "text/csv",
        "application/csv",
        "text/plain",
        "application/json",
        "application/xml",
        "text/xml",
        # Excel files
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        # Archives
        "application/zip",
        "application/x-tar",
        "application/gzip",
        "application/x-7z-compressed",
        # Images
        "image/png",
        "image/jpeg",
        "image/gif",
        # PDF
        "application/pdf",
        # Parquet
        "application/octet-stream",  # Parquet files
    }

    # Blocked file extensions
    BLOCKED_EXTENSIONS = {
        ".exe", ".dll", ".bat", ".cmd", ".sh", ".ps1",
        ".vbs", ".js", ".jar", ".app", ".dmg", ".deb", ".rpm"
    }

    def __init__(self):
        """Initialize validation service"""
        self.magic = magic.Magic(mime=True)

    async def validate_file(
        self,
        db: AsyncSession,
        file_id: int
    ) -> Dict[str, Any]:
        """
        Validate uploaded file

        Args:
            db: Database session
            file_id: File upload ID

        Returns:
            Validation result dict
        """
        # Get file upload record
        result = await db.execute(select(FileUpload).where(FileUpload.id == file_id))
        file_upload = result.scalar_one_or_none()

        if not file_upload:
            return {
                "valid": False,
                "errors": ["File upload not found"]
            }

        validation_errors = []

        # Update status to validating
        file_upload.status = FileStatus.VALIDATING
        await db.commit()

        try:
            # Check file exists
            if not os.path.exists(file_upload.file_path):
                validation_errors.append("Physical file not found")
                file_upload.status = FileStatus.FAILED
                file_upload.validation_errors = {"errors": validation_errors}
                await db.commit()
                return {"valid": False, "errors": validation_errors}

            # Check file extension
            ext = Path(file_upload.original_filename).suffix.lower()
            if ext in self.BLOCKED_EXTENSIONS:
                validation_errors.append(f"File extension {ext} is not allowed")

            # Verify actual file size
            actual_size = os.path.getsize(file_upload.file_path)
            if actual_size != file_upload.file_size:
                validation_errors.append(
                    f"File size mismatch. Expected {file_upload.file_size}, got {actual_size}"
                )
                file_upload.file_size = actual_size  # Update to actual size

            # Check file size limits
            size_limit = self.FILE_SIZE_LIMITS.get(file_upload.file_type, 1 * 1024 * 1024 * 1024)
            if actual_size > size_limit:
                validation_errors.append(
                    f"File size ({actual_size} bytes) exceeds limit ({size_limit} bytes)"
                )

            # Detect actual MIME type
            try:
                detected_mime = self.magic.from_file(file_upload.file_path)
                file_upload.mime_type = detected_mime

                # Check if MIME type is allowed
                if detected_mime not in self.ALLOWED_MIME_TYPES:
                    # Be lenient for some types
                    if not any(allowed in detected_mime for allowed in [
                        "text", "application/json", "application/xml", "image"
                    ]):
                        validation_errors.append(
                            f"MIME type {detected_mime} is not allowed"
                        )
            except Exception as e:
                validation_errors.append(f"Error detecting MIME type: {str(e)}")

            # File-type specific validation
            type_errors = await self._validate_file_type_specific(file_upload)
            validation_errors.extend(type_errors)

            # Update validation status
            if validation_errors:
                file_upload.status = FileStatus.FAILED
                file_upload.is_validated = False
                file_upload.validation_errors = {"errors": validation_errors}
            else:
                file_upload.status = FileStatus.UPLOADED
                file_upload.is_validated = True
                file_upload.validation_errors = None

            await db.commit()
            await db.refresh(file_upload)

            return {
                "valid": len(validation_errors) == 0,
                "errors": validation_errors,
                "file_id": file_upload.id,
                "mime_type": file_upload.mime_type,
                "file_size": file_upload.file_size
            }

        except Exception as e:
            file_upload.status = FileStatus.FAILED
            file_upload.validation_errors = {"errors": [f"Validation error: {str(e)}"]}
            await db.commit()
            return {
                "valid": False,
                "errors": [f"Validation error: {str(e)}"]
            }

    async def _validate_file_type_specific(
        self,
        file_upload: FileUpload
    ) -> List[str]:
        """Perform file-type specific validation"""
        errors = []

        try:
            if file_upload.file_type == FileType.CSV:
                errors.extend(await self._validate_csv(file_upload))
            elif file_upload.file_type == FileType.JSON:
                errors.extend(await self._validate_json(file_upload))
            elif file_upload.file_type == FileType.EXCEL:
                errors.extend(await self._validate_excel(file_upload))
            elif file_upload.file_type == FileType.IMAGE:
                errors.extend(await self._validate_image(file_upload))
        except Exception as e:
            errors.append(f"Type-specific validation error: {str(e)}")

        return errors

    async def _validate_csv(self, file_upload: FileUpload) -> List[str]:
        """Validate CSV file"""
        errors = []

        try:
            # Detect encoding
            with open(file_upload.file_path, 'rb') as f:
                raw_data = f.read(10000)  # Read first 10KB
                result = chardet.detect(raw_data)
                encoding = result['encoding']

            # Try to read first few lines
            with open(file_upload.file_path, 'r', encoding=encoding) as f:
                # Check if file is empty
                first_line = f.readline()
                if not first_line.strip():
                    errors.append("CSV file is empty")
                    return errors

                # Count columns
                import csv
                f.seek(0)
                reader = csv.reader(f)
                header = next(reader, None)

                if not header:
                    errors.append("CSV file has no header row")
                    return errors

                # Check for consistent column count (sample first 100 rows)
                column_count = len(header)
                for i, row in enumerate(reader):
                    if i >= 100:
                        break
                    if len(row) != column_count:
                        errors.append(
                            f"Inconsistent column count at row {i+2}: expected {column_count}, got {len(row)}"
                        )
                        break

        except Exception as e:
            errors.append(f"CSV validation error: {str(e)}")

        return errors

    async def _validate_json(self, file_upload: FileUpload) -> List[str]:
        """Validate JSON file"""
        errors = []

        try:
            import json

            with open(file_upload.file_path, 'r') as f:
                try:
                    data = json.load(f)

                    # Check if it's empty
                    if not data:
                        errors.append("JSON file is empty")

                    # Check if it's valid structure (array or object)
                    if not isinstance(data, (dict, list)):
                        errors.append("JSON must be an object or array")

                except json.JSONDecodeError as e:
                    errors.append(f"Invalid JSON: {str(e)}")

        except Exception as e:
            errors.append(f"JSON validation error: {str(e)}")

        return errors

    async def _validate_excel(self, file_upload: FileUpload) -> List[str]:
        """Validate Excel file"""
        errors = []

        try:
            import openpyxl

            try:
                workbook = openpyxl.load_workbook(file_upload.file_path, read_only=True)

                # Check if it has sheets
                if len(workbook.sheetnames) == 0:
                    errors.append("Excel file has no sheets")

                workbook.close()

            except Exception as e:
                errors.append(f"Invalid Excel file: {str(e)}")

        except ImportError:
            errors.append("Excel validation requires openpyxl library")
        except Exception as e:
            errors.append(f"Excel validation error: {str(e)}")

        return errors

    async def _validate_image(self, file_upload: FileUpload) -> List[str]:
        """Validate image file"""
        errors = []

        try:
            from PIL import Image

            try:
                with Image.open(file_upload.file_path) as img:
                    # Verify it's a valid image
                    img.verify()

                    # Check image dimensions
                    img = Image.open(file_upload.file_path)  # Reopen after verify
                    width, height = img.size

                    if width > 50000 or height > 50000:
                        errors.append(f"Image dimensions too large: {width}x{height}")

            except Exception as e:
                errors.append(f"Invalid image file: {str(e)}")

        except ImportError:
            errors.append("Image validation requires Pillow library")
        except Exception as e:
            errors.append(f"Image validation error: {str(e)}")

        return errors

    async def scan_virus(
        self,
        db: AsyncSession,
        file_id: int
    ) -> Dict[str, Any]:
        """
        Scan file for viruses using ClamAV

        Args:
            db: Database session
            file_id: File upload ID

        Returns:
            Scan result dict
        """
        # Get file upload record
        result = await db.execute(select(FileUpload).where(FileUpload.id == file_id))
        file_upload = result.scalar_one_or_none()

        if not file_upload:
            return {
                "scanned": False,
                "error": "File upload not found"
            }

        scan_result = "clean"
        scan_error = None

        try:
            # Try to connect to ClamAV daemon
            try:
                import pyclamd

                cd = pyclamd.ClamdUnixSocket()

                # Test connection
                if not cd.ping():
                    # ClamAV not available - skip scanning but don't fail
                    scan_result = "not_scanned"
                    scan_error = "ClamAV daemon not available"
                else:
                    # Scan file
                    scan_response = cd.scan_file(file_upload.file_path)

                    if scan_response is None:
                        scan_result = "clean"
                    else:
                        # File is infected
                        scan_result = "infected"
                        scan_error = str(scan_response)

            except ImportError:
                scan_result = "not_scanned"
                scan_error = "pyclamd library not available"
            except Exception as e:
                scan_result = "error"
                scan_error = f"Scan error: {str(e)}"

            # Update file upload record
            file_upload.is_virus_scanned = True
            file_upload.virus_scan_result = scan_result

            if scan_result == "infected":
                file_upload.status = FileStatus.FAILED
                file_upload.validation_errors = {
                    "errors": [f"Virus detected: {scan_error}"]
                }

            await db.commit()
            await db.refresh(file_upload)

            return {
                "scanned": True,
                "result": scan_result,
                "clean": scan_result == "clean",
                "error": scan_error,
                "file_id": file_upload.id
            }

        except Exception as e:
            file_upload.is_virus_scanned = False
            file_upload.virus_scan_result = "error"
            await db.commit()

            return {
                "scanned": False,
                "result": "error",
                "clean": False,
                "error": f"Scan error: {str(e)}"
            }

    async def validate_and_scan(
        self,
        db: AsyncSession,
        file_id: int
    ) -> Dict[str, Any]:
        """
        Perform both validation and virus scan

        Args:
            db: Database session
            file_id: File upload ID

        Returns:
            Combined validation and scan results
        """
        # Validate file
        validation_result = await self.validate_file(db, file_id)

        # If validation failed, don't scan
        if not validation_result["valid"]:
            return {
                "valid": False,
                "scanned": False,
                "validation": validation_result,
                "scan": None
            }

        # Scan for viruses
        scan_result = await self.scan_virus(db, file_id)

        return {
            "valid": validation_result["valid"],
            "scanned": scan_result["scanned"],
            "clean": scan_result["clean"],
            "validation": validation_result,
            "scan": scan_result
        }
