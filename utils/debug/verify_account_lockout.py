# utils/debug/verify_account_lockout.py

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import os
import sys

# Add the project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from backend.services.auth_service import authenticate_user
from backend.core.config import get_settings
from backend.models.user import User

# --- Configuration ---
DATABASE_URL = get_settings().database_uri
if "postgresql+asyncpg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql", "postgresql+asyncpg")

# Rate limiting settings from your application
# You may need to adjust these if they are configured differently
MAX_LOGIN_ATTEMPTS = get_settings().max_login_attempts
LOCKOUT_DURATION_MINUTES = get_settings().lockout_duration

# --- Database Setup ---
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def verify_lockout_policy():
    """
    Tests the account lockout policy by simulating multiple failed login attempts.
    """
    print("--- Account Lockout Policy Verification ---")
    
    target_email = input("Enter the email of the user to test (e.g., a non-admin test user): ")
    if not target_email:
        print("Email cannot be empty. Aborting.")
        return

    async with AsyncSessionLocal() as session:
        try:
            print(f"\nSimulating {MAX_LOGIN_ATTEMPTS} failed login attempts for '{target_email}'...")
            
            for i in range(MAX_LOGIN_ATTEMPTS):
                print(f"  Attempt {i + 1}/{MAX_LOGIN_ATTEMPTS} with incorrect password...")
                await authenticate_user(session, target_email, "wrong-password-for-testing")
                await asyncio.sleep(0.1) # Small delay between attempts

            print("\nVerifying account status...")
            
            # This is a simplified check. In a real scenario, you'd check a field
            # like `failed_login_attempts` or `locked_until`.
            # For this script, we assume the `authenticate_user` function handles this logic.
            
            print("Attempting to log in one more time (should fail if locked)...")
            final_attempt = await authenticate_user(session, target_email, "wrong-password-for-testing")

            if final_attempt is None:
                print("\n--- Verification Successful ---")
                print(f"  The account '{target_email}' appears to be locked after {MAX_LOGIN_ATTEMPTS} failed attempts.")
                print(f"  This indicates the lockout policy is likely working.")
                print(f"  The lockout should last approximately {LOCKOUT_DURATION_MINUTES} minutes.")
                print("---------------------------------------\\n")
            else:
                print("\n--- Verification Failed ---")
                print("  The account was not locked after the maximum number of failed attempts.")
                print("  The `authenticate_user` function did not prevent login.")
                print("  Please review your application's rate limiting and account lockout logic.")
                print("---------------------------------\n")

        except Exception as e:
            print(f"\nAn error occurred: {e}")
            print("Please ensure the test user exists and the application is configured correctly.")

async def main():
    await verify_lockout_policy()

if __name__ == "__main__":
    asyncio.run(main())
