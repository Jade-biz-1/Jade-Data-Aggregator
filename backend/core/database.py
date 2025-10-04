from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from backend.core.config import settings


# Create the SQLAlchemy async engine with optimized connection pooling (T038)
engine = create_async_engine(
    settings.database_uri,
    echo=False,  # Disable echo in production for performance
    pool_size=20,  # Maximum number of connections to keep in pool
    max_overflow=40,  # Maximum overflow connections
    pool_pre_ping=True,  # Verify connections before using
    pool_recycle=3600,  # Recycle connections after 1 hour
    pool_timeout=30,  # Connection timeout in seconds
)

# Create the async session factory
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,  # Optimize for performance
)

# Create the base class for declarative models
Base = declarative_base()


# Dependency to get the database session
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session