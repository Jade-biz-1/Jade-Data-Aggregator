#!/usr/bin/env python3
"""
Test Data Seeding Script
Data Aggregator Platform - Testing Framework

Creates known test data for reproducible tests:
- 6 test users (one for each role)
- Sample pipelines, connectors, transformations
"""

import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from backend.core.config import settings
from backend.core.security import get_password_hash
from backend.models.user import User
from backend.models.pipeline import Pipeline
from backend.models.connector import Connector
from backend.models.transformation import Transformation

# Test database URL (override settings)
TEST_DATABASE_URL = "postgresql+asyncpg://test_user:test_password@localhost:5433/dataaggregator_test"

# Test users data
TEST_USERS = [
    {
        "email": "admin@test.com",
        "password": "AdminTest123!",
        "full_name": "Test Admin",
        "role": "admin",
        "is_active": True
    },
    {
        "email": "developer@test.com",
        "password": "DevTest123!",
        "full_name": "Test Developer",
        "role": "developer",
        "is_active": True
    },
    {
        "email": "designer@test.com",
        "password": "DesignerTest123!",
        "full_name": "Test Designer",
        "role": "designer",
        "is_active": True
    },
    {
        "email": "executor@test.com",
        "password": "ExecutorTest123!",
        "full_name": "Test Executor",
        "role": "executor",
        "is_active": True
    },
    {
        "email": "viewer@test.com",
        "password": "ViewerTest123!",
        "full_name": "Test Viewer",
        "role": "viewer",
        "is_active": True
    },
    {
        "email": "executive@test.com",
        "password": "ExecutiveTest123!",
        "full_name": "Test Executive",
        "role": "executive",
        "is_active": True
    }
]


async def seed_test_data():
    """Seed test database with known test data"""
    
    print("=" * 60)
    print("Test Data Seeding Script")
    print("=" * 60)
    
    # Create async engine
    engine = create_async_engine(TEST_DATABASE_URL, echo=True)
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        print("\n1. Creating test users...")
        
        for user_data in TEST_USERS:
            # Check if user exists
            result = await session.execute(
                f"SELECT id FROM users WHERE email = '{user_data['email']}'"
            )
            existing_user = result.first()
            
            if existing_user:
                print(f"   - User {user_data['email']} already exists, skipping")
                continue
            
            # Create user
            hashed_password = get_password_hash(user_data["password"])
            user = User(
                email=user_data["email"],
                hashed_password=hashed_password,
                full_name=user_data["full_name"],
                role=user_data["role"],
                is_active=user_data["is_active"]
            )
            session.add(user)
            print(f"   ✓ Created user: {user_data['email']} (role: {user_data['role']})")
        
        await session.commit()
        
        print("\n2. Test users created successfully!")
        print("\nTest User Credentials:")
        print("-" * 60)
        for user_data in TEST_USERS:
            print(f"Email: {user_data['email']}")
            print(f"Password: {user_data['password']}")
            print(f"Role: {user_data['role']}")
            print("-" * 60)
    
    await engine.dispose()
    
    print("\n" + "=" * 60)
    print("Test data seeding completed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(seed_test_data())
