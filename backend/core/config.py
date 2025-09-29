import secrets
from typing import List, Optional
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


settings = Settings()