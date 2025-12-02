# utils/debug/test_admin_login.py

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import os
import sys
import getpass

# Add the project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from backend.services.auth_service import authenticate_user
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

async def test_admin_login(password: str):
    """
    Attempts to authenticate the admin user with the provided password.
    """
    print("\nAttempting to authenticate admin user...")
    async with AsyncSessionLocal() as session:
        try:
            admin_email = get_settings().admin_email
            
            print(f"Authenticating with email: {admin_email}")
            
            authenticated_user = await authenticate_user(session, admin_email, password)
            
            if authenticated_user:
                print("\n--- Authentication Successful ---")
                print(f"  Welcome, {authenticated_user.username}!")
                print(f"  User ID: {authenticated_user.id}")
                print(f"  Role: {authenticated_user.role}")
                print("-------------------------------------\n")
            else:
                print("\n--- Authentication Failed ---")
                print("  Invalid email or password.")
                print("  Possible reasons:")
                print("  - The password you entered is incorrect.")
                print("  - The admin user account does not exist or is inactive.")
                print("  - The database connection is misconfigured.")
                print("---------------------------------\n")

        except Exception as e:
            print(f"\nAn error occurred during authentication: {e}")
            print("Please check your application's configuration and database status.")

async def main():
    print("--- Admin Login Test Utility ---")
    
    admin_password = getpass.getpass("Enter the admin user's password to test: ")
    
    if not admin_password:
        print("Password cannot be empty. Aborting.")
        return
        
    await test_admin_login(admin_password)

if __name__ == "__main__":
    asyncio.run(main())
