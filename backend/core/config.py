import secrets
from typing import List, Optional
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings
import json

class Settings(BaseSettings):
    PROJECT_NAME: str = "Data Aggregator Platform"
    DESCRIPTION: str = "A comprehensive data integration solution designed to connect, process, and deliver data from multiple sources in a standardized format."
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = Field(default_factory=secrets.token_urlsafe)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database
    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    SQLALCHEMY_DATABASE_URI: Optional[str] = None
    
    # Redis
    REDIS_URL: str
    
    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    
    # CORS - Use a simple string and convert to list in a property
    BACKEND_CORS_ORIGINS: str = ""
    
    # Auth
    OAUTH_JWKS_URL: Optional[str] = None

    # Phase 8: Environment and Role Management
    ENVIRONMENT: str = "development"  # development, staging, production
    CREATE_DEV_USER: str = "false"  # Create developer user on init
    AUTO_INIT_DB: str = "true"  # Auto-initialize database
    ALLOW_DEV_ROLE_IN_PRODUCTION: str = "false"  # Allow developer role in production

    # Phase 9: File Storage Paths (Service Decoupling)
    TEMP_FILES_PATH: str = "temp"  # Temporary files directory
    UPLOAD_PATH: str = "uploads"  # Upload files directory
    LOG_PATH: str = "logs"  # Log files directory

    class Config:
        case_sensitive = True
        env_file = ".env"

    @property
    def cors_origins_list(self) -> List[str]:
        """Convert the CORS origins string to a list of origins"""
        if not self.BACKEND_CORS_ORIGINS:
            return []
        
        # Check if it's a JSON array
        if self.BACKEND_CORS_ORIGINS.strip().startswith('['):
            try:
                return json.loads(self.BACKEND_CORS_ORIGINS)
            except json.JSONDecodeError:
                pass  # Fall back to comma-separated parsing
        
        # Otherwise treat as comma-separated values
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(',') if origin.strip()]

    @property
    def database_uri(self) -> str:
        if self.SQLALCHEMY_DATABASE_URI:
            return self.SQLALCHEMY_DATABASE_URI
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}/{self.POSTGRES_DB}"

    @property
    def DATABASE_URL(self) -> str:
        """Alias for database_uri (used by backup utilities)"""
        # Return sync URL for pg_dump/pg_restore
        if self.SQLALCHEMY_DATABASE_URI:
            return self.SQLALCHEMY_DATABASE_URI.replace('+asyncpg', '')
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}/{self.POSTGRES_DB}"

    # Phase 9: Path Properties for Service Decoupling
    @property
    def temp_files_dir(self) -> Path:
        """Get the temporary files directory as a Path object."""
        return Path(self.TEMP_FILES_PATH)

    @property
    def upload_dir(self) -> Path:
        """Get the upload files directory as a Path object."""
        return Path(self.UPLOAD_PATH)

    @property
    def log_dir(self) -> Path:
        """Get the log files directory as a Path object."""
        return Path(self.LOG_PATH)


settings = Settings()