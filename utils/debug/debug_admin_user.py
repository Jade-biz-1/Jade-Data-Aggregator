# utils/debug/debug_admin_user.py

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
import os
import sys

# Add the project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from backend.models.user import User
from backend.core.config import get_settings

# --- Configuration ---
DATABASE_URL = get_settings().database_uri
if "postgresql+asyncpg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql", "postgresql+asyncpg")

# --- Database Setup ---
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_admin_user_details():
    """
    Fetches and prints the details of the primary admin user.
    """
    print("Attempting to connect to the database...")
    async with AsyncSessionLocal() as session:
        try:
            # The admin user is typically the first user or has a specific username/email
            admin_email = get_settings().admin_email
            
            query = select(User).where(User.email == admin_email)
            result = await session.execute(query)
            admin_user = result.scalars().first()

            if admin_user:
                print("\n--- Admin User Details ---")
                print(f"  ID: {admin_user.id}")
                print(f"  Username: {admin_user.username}")
                print(f"  Email: {admin_user.email}")
                print(f"  Full Name: {admin_user.full_name}")
                print(f"  Role: {admin_user.role}")
                print(f"  Is Active: {admin_user.is_active}")
                print(f"  Is Verified: {admin_user.is_verified}")
                print(f"  Created At: {admin_user.created_at}")
                print(f"  Updated At: {admin_user.updated_at}")
                print(f"  Hashed Password (first 30 chars): {admin_user.hashed_password[:30]}...")
                print("--------------------------\n")
            else:
                print(f"Admin user with email '{admin_email}' not found.")

        except Exception as e:
            print(f"An error occurred while connecting to the database or fetching the user: {e}")
            print("Please check your database connection settings and ensure the database is running.")

async def main():
    await get_admin_user_details()

if __name__ == "__main__":
    print("Running Admin User Debug Script...")
    asyncio.run(main())
