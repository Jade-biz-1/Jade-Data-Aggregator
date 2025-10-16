"""
Unit tests for Cleanup Service (Phase 8).
Tests system cleanup and maintenance operations.
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from backend.services.cleanup_service import CleanupService


class TestCleanupService:
    """Test suite for CleanupService."""

    @pytest.mark.asyncio
    async def test_clean_old_activity_logs_success(self):
        """Test successful cleanup of old activity logs."""
        # Mock database session
        db_mock = AsyncMock()
        db_mock.execute = AsyncMock()
        db_mock.commit = AsyncMock()

        # Mock count result
        count_result_mock = MagicMock()
        count_result_mock.scalar.return_value = 150
        db_mock.execute.return_value = count_result_mock

        result = await CleanupService.clean_old_activity_logs(db_mock, days_to_keep=90)

        assert result["success"] == True
        assert result["records_deleted"] == 150
        assert result["days_kept"] == 90
        assert "cutoff_date" in result
        db_mock.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_clean_old_activity_logs_error_handling(self):
        """Test error handling in activity logs cleanup."""
        db_mock = AsyncMock()
        db_mock.execute = AsyncMock(side_effect=Exception("Database error"))
        db_mock.rollback = AsyncMock()

        result = await CleanupService.clean_old_activity_logs(db_mock, days_to_keep=90)

        assert result["success"] == False
        assert "error" in result
        assert result["records_deleted"] == 0
        db_mock.rollback.assert_called_once()

    @pytest.mark.asyncio
    async def test_clean_orphaned_pipeline_runs(self):
        """Test cleanup of orphaned pipeline runs."""
        db_mock = AsyncMock()
        db_mock.execute = AsyncMock()
        db_mock.commit = AsyncMock()

        # Mock result with deleted IDs
        result_mock = MagicMock()
        result_mock.fetchall.return_value = [(1,), (2,), (3,)]
        db_mock.execute.return_value = result_mock

        result = await CleanupService.clean_orphaned_pipeline_runs(db_mock)

        assert result["success"] == True
        assert result["records_deleted"] == 3
        assert result["type"] == "orphaned_pipeline_runs"
        db_mock.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_clean_temp_files_success(self):
        """Test successful cleanup of temporary files."""
        with patch('backend.services.cleanup_service.Path') as mock_path:
            temp_dir_mock = MagicMock()
            temp_dir_mock.exists.return_value = True

            # Mock file objects
            old_file = MagicMock()
            old_file.is_file.return_value = True
            old_file.stat.return_value.st_mtime = (datetime.now() - timedelta(hours=48)).timestamp()
            old_file.stat.return_value.st_size = 1024 * 1024  # 1 MB

            temp_dir_mock.rglob.return_value = [old_file]
            mock_path.return_value = temp_dir_mock

            result = await CleanupService.clean_temp_files(max_age_hours=24)

            assert result["success"] == True
            assert result["files_deleted"] == 1
            assert result["space_freed_mb"] == 1.0
            old_file.unlink.assert_called_once()

    @pytest.mark.asyncio
    async def test_clean_temp_files_directory_not_exists(self):
        """Test temp files cleanup when directory doesn't exist."""
        with patch('backend.services.cleanup_service.Path') as mock_path:
            temp_dir_mock = MagicMock()
            temp_dir_mock.exists.return_value = False
            mock_path.return_value = temp_dir_mock

            result = await CleanupService.clean_temp_files(max_age_hours=24)

            assert result["success"] == True
            assert result["files_deleted"] == 0
            assert result["space_freed_mb"] == 0
            assert "does not exist" in result["message"]

    @pytest.mark.asyncio
    async def test_clean_old_execution_logs(self):
        """Test cleanup of old execution logs."""
        db_mock = AsyncMock()
        db_mock.execute = AsyncMock()
        db_mock.commit = AsyncMock()

        result_mock = MagicMock()
        result_mock.fetchall.return_value = [(i,) for i in range(50)]
        db_mock.execute.return_value = result_mock

        result = await CleanupService.clean_old_execution_logs(db_mock, days_to_keep=30)

        assert result["success"] == True
        assert result["records_deleted"] == 50
        assert result["days_kept"] == 30
        db_mock.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_vacuum_database_success(self):
        """Test successful database VACUUM operation."""
        db_mock = AsyncMock()
        db_mock.commit = AsyncMock()

        connection_mock = AsyncMock()
        connection_mock.exec_driver_sql = AsyncMock()
        db_mock.connection.return_value = connection_mock

        result = await CleanupService.vacuum_database(db_mock)

        assert result["success"] == True
        assert "vacuum completed" in result["message"].lower()
        db_mock.commit.assert_called_once()
        connection_mock.exec_driver_sql.assert_called_once_with("VACUUM ANALYZE")

    @pytest.mark.asyncio
    async def test_vacuum_database_error(self):
        """Test error handling in database VACUUM."""
        db_mock = AsyncMock()
        db_mock.commit = AsyncMock()
        db_mock.connection = AsyncMock(side_effect=Exception("VACUUM failed"))

        result = await CleanupService.vacuum_database(db_mock)

        assert result["success"] == False
        assert "error" in result

    @pytest.mark.asyncio
    async def test_clean_expired_sessions(self):
        """Test cleanup of expired sessions."""
        db_mock = AsyncMock()
        db_mock.execute = AsyncMock()
        db_mock.commit = AsyncMock()

        # Mock count query
        count_result = MagicMock()
        count_result.scalar.return_value = 25
        db_mock.execute.return_value = count_result

        result = await CleanupService.clean_expired_sessions(db_mock)

        assert result["success"] == True
        assert result["records_deleted"] == 25
        db_mock.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_clean_all_comprehensive(self):
        """Test comprehensive cleanup of all operations."""
        db_mock = AsyncMock()
        db_mock.execute = AsyncMock()
        db_mock.commit = AsyncMock()
        db_mock.connection = AsyncMock()

        # Mock all individual cleanup operations
        with patch.object(CleanupService, 'clean_old_activity_logs', new_callable=AsyncMock) as mock_activity, \
             patch.object(CleanupService, 'clean_orphaned_pipeline_runs', new_callable=AsyncMock) as mock_orphaned, \
             patch.object(CleanupService, 'clean_temp_files', new_callable=AsyncMock) as mock_temp, \
             patch.object(CleanupService, 'clean_old_execution_logs', new_callable=AsyncMock) as mock_execution, \
             patch.object(CleanupService, 'clean_expired_sessions', new_callable=AsyncMock) as mock_sessions, \
             patch.object(CleanupService, 'vacuum_database', new_callable=AsyncMock) as mock_vacuum:

            # Setup return values
            mock_activity.return_value = {"success": True, "records_deleted": 100}
            mock_orphaned.return_value = {"success": True, "records_deleted": 5}
            mock_temp.return_value = {"success": True, "files_deleted": 10, "space_freed_mb": 50.5}
            mock_execution.return_value = {"success": True, "records_deleted": 30}
            mock_sessions.return_value = {"success": True, "records_deleted": 15}
            mock_vacuum.return_value = {"success": True}

            result = await CleanupService.clean_all(
                db_mock,
                activity_log_days=90,
                execution_log_days=30,
                temp_file_hours=24
            )

            assert "started_at" in result
            assert "completed_at" in result
            assert "operations" in result
            assert "summary" in result

            # Verify summary calculations
            assert result["summary"]["total_records_deleted"] == 150  # 100+5+30+15
            assert result["summary"]["total_files_deleted"] == 10
            assert result["summary"]["total_space_freed_mb"] == 50.5
            assert result["summary"]["success"] == True

            # Verify all cleanup methods were called
            mock_activity.assert_called_once()
            mock_orphaned.assert_called_once()
            mock_temp.assert_called_once()
            mock_execution.assert_called_once()
            mock_sessions.assert_called_once()
            mock_vacuum.assert_called_once()

    @pytest.mark.asyncio
    async def test_clean_all_partial_failure(self):
        """Test cleanup_all with some operations failing."""
        db_mock = AsyncMock()

        with patch.object(CleanupService, 'clean_old_activity_logs', new_callable=AsyncMock) as mock_activity, \
             patch.object(CleanupService, 'clean_orphaned_pipeline_runs', new_callable=AsyncMock) as mock_orphaned, \
             patch.object(CleanupService, 'clean_temp_files', new_callable=AsyncMock) as mock_temp, \
             patch.object(CleanupService, 'clean_old_execution_logs', new_callable=AsyncMock) as mock_execution, \
             patch.object(CleanupService, 'clean_expired_sessions', new_callable=AsyncMock) as mock_sessions, \
             patch.object(CleanupService, 'vacuum_database', new_callable=AsyncMock) as mock_vacuum:

            # Setup some failures
            mock_activity.return_value = {"success": True, "records_deleted": 100}
            mock_orphaned.return_value = {"success": False, "error": "Failed", "records_deleted": 0}
            mock_temp.return_value = {"success": True, "files_deleted": 5, "space_freed_mb": 10.0}
            mock_execution.return_value = {"success": True, "records_deleted": 20}
            mock_sessions.return_value = {"success": True, "records_deleted": 10}
            mock_vacuum.return_value = {"success": False, "error": "VACUUM failed"}

            result = await CleanupService.clean_all(db_mock)

            # Summary should reflect partial failure
            assert result["summary"]["success"] == False  # Not all operations succeeded
            assert result["summary"]["total_records_deleted"] == 130  # Only successful operations
