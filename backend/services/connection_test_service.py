"""
Connection Testing Service
Tests and validates connector configurations
"""

from typing import Dict, Any, Optional, Tuple
from datetime import datetime
import asyncio
from sqlalchemy import create_engine, text
import requests


class ConnectionTestResult:
    """Result of a connection test"""

    def __init__(
        self,
        success: bool,
        message: str,
        details: Optional[Dict[str, Any]] = None,
        duration_ms: Optional[float] = None
    ):
        self.success = success
        self.message = message
        self.details = details or {}
        self.duration_ms = duration_ms
        self.tested_at = datetime.now()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "message": self.message,
            "details": self.details,
            "duration_ms": self.duration_ms,
            "tested_at": self.tested_at.isoformat()
        }


class ConnectionTestService:
    """Service for testing various connector connections"""

    @staticmethod
    async def test_database_connection(config: Dict[str, Any]) -> ConnectionTestResult:
        """
        Test database connection

        Args:
            config: Database configuration with host, port, database, username, password, etc.
        """
        start_time = datetime.now()

        try:
            # Build connection string based on database type
            connector_type = config.get("connector_type", "postgresql")

            if connector_type == "postgresql":
                connection_string = ConnectionTestService._build_postgres_connection_string(config)
            elif connector_type == "mysql":
                connection_string = ConnectionTestService._build_mysql_connection_string(config)
            else:
                return ConnectionTestResult(
                    success=False,
                    message=f"Unsupported database type: {connector_type}"
                )

            # Test connection
            engine = create_engine(connection_string, pool_pre_ping=True)

            with engine.connect() as connection:
                # Execute simple query
                result = connection.execute(text("SELECT 1"))
                result.fetchone()

                # Get database info
                if connector_type == "postgresql":
                    version_result = connection.execute(text("SELECT version()"))
                    version = version_result.fetchone()[0]
                elif connector_type == "mysql":
                    version_result = connection.execute(text("SELECT VERSION()"))
                    version = version_result.fetchone()[0]
                else:
                    version = "Unknown"

            engine.dispose()

            duration = (datetime.now() - start_time).total_seconds() * 1000

            return ConnectionTestResult(
                success=True,
                message="Successfully connected to database",
                details={
                    "database_version": version,
                    "database_type": connector_type,
                    "host": config.get("host"),
                    "port": config.get("port"),
                    "database": config.get("database")
                },
                duration_ms=round(duration, 2)
            )

        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds() * 1000

            return ConnectionTestResult(
                success=False,
                message=f"Connection failed: {str(e)}",
                details={"error_type": type(e).__name__},
                duration_ms=round(duration, 2)
            )

    @staticmethod
    def _build_postgres_connection_string(config: Dict[str, Any]) -> str:
        """Build PostgreSQL connection string"""
        host = config.get("host", "localhost")
        port = config.get("port", 5432)
        database = config.get("database")
        username = config.get("username")
        password = config.get("password")
        ssl_mode = config.get("ssl_mode", "prefer")

        connection_string = f"postgresql://{username}:{password}@{host}:{port}/{database}"

        if ssl_mode and ssl_mode != "disable":
            connection_string += f"?sslmode={ssl_mode}"

        return connection_string

    @staticmethod
    def _build_mysql_connection_string(config: Dict[str, Any]) -> str:
        """Build MySQL connection string"""
        host = config.get("host", "localhost")
        port = config.get("port", 3306)
        database = config.get("database")
        username = config.get("username")
        password = config.get("password")
        charset = config.get("charset", "utf8mb4")

        return f"mysql+pymysql://{username}:{password}@{host}:{port}/{database}?charset={charset}"

    @staticmethod
    async def test_api_connection(config: Dict[str, Any]) -> ConnectionTestResult:
        """
        Test REST API connection

        Args:
            config: API configuration with base_url, auth_type, credentials, etc.
        """
        start_time = datetime.now()

        try:
            base_url = config.get("base_url")
            if not base_url:
                return ConnectionTestResult(
                    success=False,
                    message="Base URL is required"
                )

            # Build headers
            headers = {}

            auth_type = config.get("auth_type", "none")

            if auth_type == "api_key":
                api_key = config.get("api_key")
                api_key_header = config.get("api_key_header", "X-API-Key")
                if api_key:
                    headers[api_key_header] = api_key

            elif auth_type == "bearer_token":
                bearer_token = config.get("bearer_token")
                if bearer_token:
                    headers["Authorization"] = f"Bearer {bearer_token}"

            # Add custom headers
            custom_headers = config.get("custom_headers", {})
            if isinstance(custom_headers, dict):
                headers.update(custom_headers)

            # Test connection with HEAD or GET request
            timeout = config.get("timeout", 30)

            response = requests.head(
                base_url,
                headers=headers,
                timeout=timeout,
                allow_redirects=True
            )

            # If HEAD fails, try GET
            if response.status_code == 405:  # Method not allowed
                response = requests.get(
                    base_url,
                    headers=headers,
                    timeout=timeout
                )

            duration = (datetime.now() - start_time).total_seconds() * 1000

            if response.status_code < 400:
                return ConnectionTestResult(
                    success=True,
                    message="Successfully connected to API",
                    details={
                        "status_code": response.status_code,
                        "url": base_url,
                        "auth_type": auth_type,
                        "response_headers": dict(response.headers)
                    },
                    duration_ms=round(duration, 2)
                )
            else:
                return ConnectionTestResult(
                    success=False,
                    message=f"API returned error status: {response.status_code}",
                    details={
                        "status_code": response.status_code,
                        "url": base_url
                    },
                    duration_ms=round(duration, 2)
                )

        except requests.exceptions.Timeout:
            duration = (datetime.now() - start_time).total_seconds() * 1000
            return ConnectionTestResult(
                success=False,
                message="Connection timeout",
                duration_ms=round(duration, 2)
            )

        except requests.exceptions.ConnectionError:
            duration = (datetime.now() - start_time).total_seconds() * 1000
            return ConnectionTestResult(
                success=False,
                message="Failed to connect to API endpoint",
                duration_ms=round(duration, 2)
            )

        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds() * 1000
            return ConnectionTestResult(
                success=False,
                message=f"Connection test failed: {str(e)}",
                details={"error_type": type(e).__name__},
                duration_ms=round(duration, 2)
            )

    @staticmethod
    async def test_salesforce_connection(config: Dict[str, Any]) -> ConnectionTestResult:
        """
        Test Salesforce connection

        Args:
            config: Salesforce configuration
        """
        start_time = datetime.now()

        try:
            # This is a simplified test - in production, use simple-salesforce library
            instance_url = config.get("instance_url")
            username = config.get("username")
            password = config.get("password")
            security_token = config.get("security_token")

            if not all([instance_url, username, password, security_token]):
                return ConnectionTestResult(
                    success=False,
                    message="Missing required Salesforce credentials"
                )

            # Mock connection test (replace with actual Salesforce API call)
            duration = (datetime.now() - start_time).total_seconds() * 1000

            return ConnectionTestResult(
                success=True,
                message="Salesforce connection configured (test with actual API for full validation)",
                details={
                    "instance_url": instance_url,
                    "username": username,
                    "api_version": config.get("api_version", "v58.0"),
                    "sandbox": config.get("sandbox", False)
                },
                duration_ms=round(duration, 2)
            )

        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds() * 1000
            return ConnectionTestResult(
                success=False,
                message=f"Salesforce connection test failed: {str(e)}",
                duration_ms=round(duration, 2)
            )

    @staticmethod
    async def test_file_access(config: Dict[str, Any]) -> ConnectionTestResult:
        """
        Test file access

        Args:
            config: File configuration
        """
        start_time = datetime.now()

        try:
            import os

            file_path = config.get("file_path")
            if not file_path:
                return ConnectionTestResult(
                    success=False,
                    message="File path is required"
                )

            # Check if file exists
            if not os.path.exists(file_path):
                return ConnectionTestResult(
                    success=False,
                    message=f"File not found: {file_path}"
                )

            # Check if file is readable
            if not os.access(file_path, os.R_OK):
                return ConnectionTestResult(
                    success=False,
                    message=f"File is not readable: {file_path}"
                )

            # Get file stats
            file_stats = os.stat(file_path)
            file_size = file_stats.st_size

            duration = (datetime.now() - start_time).total_seconds() * 1000

            return ConnectionTestResult(
                success=True,
                message="File is accessible",
                details={
                    "file_path": file_path,
                    "file_size_bytes": file_size,
                    "file_size_mb": round(file_size / (1024 * 1024), 2),
                    "readable": True,
                    "writable": os.access(file_path, os.W_OK)
                },
                duration_ms=round(duration, 2)
            )

        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds() * 1000
            return ConnectionTestResult(
                success=False,
                message=f"File access test failed: {str(e)}",
                duration_ms=round(duration, 2)
            )

    @staticmethod
    async def test_connection(
        connector_type: str,
        config: Dict[str, Any]
    ) -> ConnectionTestResult:
        """
        Test connection based on connector type

        Args:
            connector_type: Type of connector
            config: Connector configuration
        """
        # Add connector type to config for internal use
        config["connector_type"] = connector_type

        if connector_type in ["postgresql", "mysql"]:
            return await ConnectionTestService.test_database_connection(config)

        elif connector_type == "rest_api":
            return await ConnectionTestService.test_api_connection(config)

        elif connector_type == "salesforce":
            return await ConnectionTestService.test_salesforce_connection(config)

        elif connector_type in ["csv_file", "json_file"]:
            return await ConnectionTestService.test_file_access(config)

        else:
            return ConnectionTestResult(
                success=False,
                message=f"Connection testing not implemented for connector type: {connector_type}"
            )

    @staticmethod
    def get_configuration_preview(
        connector_type: str,
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate a preview of the configuration (with sensitive data masked)
        """
        preview = config.copy()

        # Mask sensitive fields
        sensitive_fields = ["password", "api_key", "bearer_token", "security_token", "basic_password"]

        for field in sensitive_fields:
            if field in preview:
                preview[field] = "••••••••"

        return {
            "connector_type": connector_type,
            "configuration": preview,
            "preview_generated_at": datetime.now().isoformat()
        }
