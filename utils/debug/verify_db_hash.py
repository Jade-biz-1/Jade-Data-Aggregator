# utils/debug/verify_db_hash.py

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
import os
import sys
import getpass

# Add the project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from backend.models.user import User
from backend.core.config import get_settings
from backend.core.security import verify_password

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

async def verify_user_password_hash():
    """
    Fetches a user's hashed password from the DB and verifies it against a provided plain-text password.
    """
    print("--- Database Password Hash Verification ---")
    
    email = input("Enter the user's email: ")
    if not email:
        print("Email cannot be empty. Aborting.")
        return
        
    plain_password = getpass.getpass("Enter the plain-text password to check: ")
    if not plain_password:
        print("Password cannot be empty. Aborting.")
        return

    async with AsyncSessionLocal() as session:
        try:
            query = select(User).where(User.email == email)
            result = await session.execute(query)
            user = result.scalars().first()

            if not user:
                print(f"\nUser with email '{email}' not found.")
                return

            print(f"\nFound user: {user.username}")
            print("Verifying password...")

            is_valid = verify_password(plain_password, user.hashed_password)
            
            if is_valid:
                print("\n---")
                print("Verification Successful ---")
                print("  The provided password matches the hash stored in the database.")
                print("-------------------------------------\\n")
            else:
                print("\n---")
                print("Verification Failed ---")
                print("  The provided password does NOT match the hash in the database.")
                print("-----------------------------\\n")

        except Exception as e:
            print(f"\nAn error occurred: {e}")
            print("Please check your database connection.")

async def main():
    await verify_user_password_hash()

if __name__ == "__main__":
    asyncio.run(main())
