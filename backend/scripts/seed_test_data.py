"""
Test Database Seeding Script
Seeds the test database with known test data for reproducible testing
"""

import asyncio
import sys
from pathlib import Path

# Add backend to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from backend.models.user import User
from backend.core.security import get_password_hash

# Test database URL
TEST_DATABASE_URL = "postgresql+asyncpg://test_user:test_password@localhost:5433/test_dataaggregator"

# Known test users (for reproducible E2E tests)
TEST_USERS = [
    {
        "username": "admin",
        "email": "admin@test.com",
        "password": "Admin123!@#",
        "role": "admin",
        "is_active": True,
    },
    {
        "username": "developer",
        "email": "dev@test.com",
        "password": "Dev123!@#",
        "role": "developer",
        "is_active": True,
    },
    {
        "username": "designer",
        "email": "designer@test.com",
        "password": "Designer123!@#",
        "role": "designer",
        "is_active": True,
    },
    {
        "username": "executor",
        "email": "executor@test.com",
        "password": "Executor123!@#",
        "role": "executor",
        "is_active": True,
    },
    {
        "username": "viewer",
        "email": "viewer@test.com",
        "password": "Viewer123!@#",
        "role": "viewer",
        "is_active": True,
    },
    {
        "username": "executive",
        "email": "executive@test.com",
        "password": "Executive123!@#",
        "role": "executive",
        "is_active": True,
    },
]


async def seed_database():
    """Seed the test database with known test data"""

    # Create async engine
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session_maker() as session:
        print("Seeding test database...")

        # Create test users
        print("Creating test users...")
        for user_data in TEST_USERS:
            user = User(
                username=user_data["username"],
                email=user_data["email"],
                hashed_password=get_password_hash(user_data["password"]),
                role=user_data["role"],
                is_active=user_data["is_active"],
            )
            session.add(user)

        await session.commit()
        print(f"✓ Created {len(TEST_USERS)} test users")

        print("✓ Test database seeded successfully!")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_database())
