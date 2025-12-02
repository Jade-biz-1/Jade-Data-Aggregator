# utils/debug/migrate_users_table.py

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from sqlalchemy import text
import os
import sys

# Add the project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

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

async def perform_migration():
    """
    Performs a specific, one-off migration on the users table.
    
    This is a template script. You should modify the logic inside the `session.execute`
    block to perform the desired data transformation.
    
    **Example:** Add a new column with a default value, or transform data in an existing column.
    """
    print("Starting data migration for the 'users' table...")
    async with AsyncSessionLocal() as session:
        async with session.begin():
            try:
                # --- IMPORTANT: DEFINE YOUR MIGRATION LOGIC HERE ---
                # Example: Add a new 'is_premium' column to the users table if it doesn't exist
                # and set the default value to False.
                
                # Step 1: Check if the column exists
                check_column_query = text(
                    "SELECT column_name FROM information_schema.columns "
                    "WHERE table_name='users' AND column_name='is_premium'"
                )
                result = await session.execute(check_column_query)
                column_exists = result.scalar_one_or_none()

                if not column_exists:
                    print("Column 'is_premium' does not exist. Adding it...")
                    # Step 2: Add the column
                    add_column_query = text("ALTER TABLE users ADD COLUMN is_premium BOOLEAN DEFAULT FALSE")
                    await session.execute(add_column_query)
                    
                    # Step 3: Set the new column's value to False for all existing users
                    update_query = text("UPDATE users SET is_premium = FALSE WHERE is_premium IS NULL")
                    await session.execute(update_query)
                    
                    print("Successfully added 'is_premium' column and set default values.")
                else:
                    print("Column 'is_premium' already exists. No migration needed.")

                # --- END OF MIGRATION LOGIC ---

                await session.commit()
                print("\nMigration completed successfully.")
                
            except Exception as e:
                print(f"An error occurred during the migration: {e}")
                print("Rolling back changes.")
                await session.rollback()

async def main():
    await perform_migration()

if __name__ == "__main__":
    print("Running a one-off migration script for the 'users' table.")
    print("---
    **WARNING:** This script directly modifies the database.
    ---
    Please back up your database before proceeding.
    ---")
    
    proceed = input("Do you want to continue? (yes/no): ")
    if proceed.lower() == 'yes':
        asyncio.run(main())
    else:
        print("Migration cancelled.")
