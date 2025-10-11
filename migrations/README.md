# Database Migrations

This directory contains SQL migration scripts for the Data Aggregator Platform.

## How to Run Migrations

### Manual Method (PostgreSQL)

```bash
# Connect to your database
psql -U your_username -d your_database_name

# Run the migration
\i migrations/001_add_system_settings.sql

# Verify
SELECT * FROM system_settings;
```

### Using psql from command line

```bash
psql "postgresql://user:password@localhost:5432/dbname" < migrations/001_add_system_settings.sql
```

### Using Python script

```bash
# From project root
python -c "
import asyncio
from backend.core.database import engine
from pathlib import Path

async def run_migration():
    async with engine.begin() as conn:
        migration_sql = Path('migrations/001_add_system_settings.sql').read_text()
        await conn.execute(migration_sql)
        print('Migration completed successfully')

asyncio.run(run_migration())
"
```

## Migration Files

### 001_add_system_settings.sql
- **Date:** 2025-10-10
- **Phase:** Phase 8 - Enhanced RBAC
- **Description:** Creates `system_settings` table for runtime configuration
- **Tables Created:**
  - `system_settings`
- **Indexes Created:**
  - `idx_system_settings_key`
  - `idx_system_settings_active`

## Rollback

If you need to rollback the system_settings migration:

```sql
-- Remove default data
DELETE FROM system_settings WHERE key = 'ALLOW_DEV_ROLE_IN_PRODUCTION';

-- Drop table and indexes
DROP TABLE IF EXISTS system_settings CASCADE;
```

## Best Practices

1. **Always backup** your database before running migrations
2. **Test migrations** in development environment first
3. **Run migrations** during maintenance windows for production
4. **Verify results** after each migration
5. **Keep migration history** for auditing purposes

## Migration Checklist

Before running migrations in production:

- [ ] Database backup created
- [ ] Migration tested in development
- [ ] Migration tested in staging (if applicable)
- [ ] Rollback plan documented
- [ ] Team notified of maintenance window
- [ ] Migration verified post-deployment

## Future Migrations

Consider setting up Alembic for automated migrations:

```bash
# Install Alembic
pip install alembic

# Initialize Alembic
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Add system settings"

# Run migration
alembic upgrade head
```
