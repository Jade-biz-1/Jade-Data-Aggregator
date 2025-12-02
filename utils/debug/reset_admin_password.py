# utils/debug/reset_admin_password.py

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
from backend.core.security import get_password_hash

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

async def reset_admin_password(new_password: str):
    """
    Finds the admin user and resets their password to the new password.
    """
    print("Attempting to reset the admin password...")
    async with AsyncSessionLocal() as session:
        async with session.begin():
            try:
                admin_email = get_settings().admin_email
                
                query = select(User).where(User.email == admin_email)
                result = await session.execute(query)
                admin_user = result.scalars().first()

                if admin_user:
                    print(f"Found admin user: {admin_user.username} ({admin_user.email})")
                    
                    # Hash the new password
                    hashed_password = get_password_hash(new_password)
                    
                    # Update the user's password
                    admin_user.hashed_password = hashed_password
                    
                    print("Password has been updated.")
                    
                    await session.commit()
                    print("Changes have been committed to the database.")
                    
                else:
                    print(f"Admin user with email '{admin_email}' not found.")

            except Exception as e:
                print(f"An error occurred: {e}")
                print("Rolling back changes.")
                await session.rollback()

async def main():
    print("--- Admin Password Reset Utility ---")
    print("**
    This script will directly modify the admin user's password in the database.
    **")
    
    new_password = getpass.getpass("Enter the new password for the admin user: ")
    confirm_password = getpass.getpass("Confirm the new password: ")
    
    if not new_password:
        print("Password cannot be empty. Aborting.")
        return
        
    if new_password != confirm_password:
        print("Passwords do not match. Aborting.")
        return
        
    await reset_admin_password(new_password)

if __name__ == "__main__":
    asyncio.run(main())
