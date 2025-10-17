# Phase 8 Operations Runbook

**Date**: October 12, 2025
**Phase**: 8 - Enhanced RBAC & System Maintenance

## Common Operations

### 1. User Management

#### Create New User
```bash
POST /api/v1/users/
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "StrongPass123",
  "role": "viewer",  # Start with minimum access
  "is_active": true
}
```

#### Change User Role
```bash
PUT /api/v1/users/{user_id}
{
  "role": "designer"
}

# Roles: viewer, executor, designer, executive, developer, admin
```

#### Reset User Password
```bash
POST /api/v1/users/{user_id}/reset-password

# Returns temporary password
# User must change on first login
```

#### Deactivate User
```bash
POST /api/v1/users/{user_id}/deactivate
```

### 2. System Maintenance

#### Run Full Cleanup
```bash
POST /api/v1/admin/cleanup/all?activity_log_days=90&execution_log_days=30&temp_file_hours=24

# Best time: During low traffic (2-4 AM)
# Duration: 5-15 minutes
# Impact: Minimal (read operations unaffected)
```

#### Check Cleanup Stats
```bash
GET /api/v1/admin/cleanup/stats

# Returns:
# - Database size
# - Table sizes
# - Record counts
# - Temp file statistics
```

#### Estimate Cleanup Impact
```bash
GET /api/v1/admin/cleanup/estimate?activity_log_days=60

# Shows what would be deleted
# Run before actual cleanup
```

#### Individual Cleanup Operations

```bash
# Activity logs (90 days retention)
POST /api/v1/admin/cleanup/activity-logs?days_to_keep=90

# Temp files (24 hours)
POST /api/v1/admin/cleanup/temp-files?max_age_hours=24

# Orphaned data
POST /api/v1/admin/cleanup/orphaned-data

# Database vacuum
POST /api/v1/admin/cleanup/database-vacuum
```

### 3. Developer Role Management

#### Enable Developer Role in Production (Emergency)
```bash
PUT /api/v1/admin/settings/dev-role-production
{
  "allow": true,
  "hours": 24  # Auto-expires after 24 hours
}

# ⚠️ Use only for emergencies
# ⚠️ Fully audited
# ⚠️ Notifies all admins
```

#### Check Developer Role Status
```bash
GET /api/v1/admin/settings/dev-role-production

# Response:
{
  "allowed": false,
  "is_production": true,
  "expires_at": null
}
```

#### Disable Developer Role
```bash
PUT /api/v1/admin/settings/dev-role-production
{
  "allow": false
}
```

### 4. Database Operations

#### Create Manual Backup
```bash
# Via script
python -c "
from backend.core.database_backup import create_database_backup
success, path, msg = create_database_backup('manual_backup')
print(f'Backup: {path}')
"

# Or via CLI
pg_dump $DATABASE_URL > manual_backup_$(date +%Y%m%d_%H%M%S).sql
```

#### List Available Backups
```bash
ls -lh backups/database/
```

#### Restore from Backup
```bash
# 1. Stop application
systemctl stop dataaggregator-backend

# 2. Restore database
psql $DATABASE_URL < backups/database/backup_20251012_020000.sql

# 3. Start application
systemctl start dataaggregator-backend
```

### 5. Monitoring & Alerts

#### View Activity Logs
```bash
GET /api/v1/admin/activity-logs?skip=0&limit=100

# Filter by action
GET /api/v1/admin/activity-logs?action=user_login

# Filter by date
GET /api/v1/admin/activity-logs?start_date=2025-10-01&end_date=2025-10-12
```

#### View User Activity
```bash
GET /api/v1/admin/activity-logs/{user_id}
```

#### Check System Health
```bash
GET /api/v1/health
GET /api/v1/monitoring/system-health
```

## Incident Response

### Unauthorized Access Attempt

```bash
# 1. Check activity logs
GET /api/v1/admin/activity-logs?action=login_failed

# 2. Identify user
GET /api/v1/users/{user_id}

# 3. Deactivate if needed
POST /api/v1/users/{user_id}/deactivate

# 4. Reset password
POST /api/v1/users/{user_id}/reset-password
```

### Developer Role Misuse in Production

```bash
# 1. Immediately disable
PUT /api/v1/admin/settings/dev-role-production
{
  "allow": false
}

# 2. Review all developer actions
GET /api/v1/admin/activity-logs?role=developer&start_date=<incident_start>

# 3. Check for unauthorized changes
# Review pipelines, connectors, users modified
```

### System Performance Degradation

```bash
# 1. Check database size
GET /api/v1/admin/cleanup/stats

# 2. Run cleanup if needed
POST /api/v1/admin/cleanup/all

# 3. Run vacuum
POST /api/v1/admin/cleanup/database-vacuum

# 4. Monitor improvement
GET /api/v1/monitoring/system-health
```

## Scheduled Maintenance

### Weekly Tasks (Sundays 2 AM)

```bash
# 1. Full system cleanup
curl -X POST http://localhost:8000/api/v1/admin/cleanup/all

# 2. Database backup
./scripts/backup_database.sh

# 3. Review activity logs
curl http://localhost:8000/api/v1/admin/activity-logs?limit=1000 > weekly_activity.json

# 4. Check system stats
curl http://localhost:8000/api/v1/admin/cleanup/stats > weekly_stats.json
```

### Monthly Tasks (1st of month)

```bash
# 1. User access review
# - Review all user roles
# - Deactivate inactive users
# - Audit sensitive role assignments

# 2. Security audit
# - Review failed login attempts
# - Check for unusual access patterns
# - Verify admin account security

# 3. Performance review
# - Check database size trends
# - Review cleanup effectiveness
# - Optimize slow queries

# 4. Backup verification
# - Test backup restoration
# - Verify backup integrity
# - Check backup storage space
```

## Emergency Procedures

### Lost Admin Password

```bash
# Via database console (requires DB access)
psql $DATABASE_URL

# Reset admin password
UPDATE users
SET hashed_password = crypt('NewStrongPassword123', gen_salt('bf'))
WHERE username = 'admin';

# Or via CLI script
python scripts/reset_admin_password.py
```

### Database Corruption

```bash
# 1. Stop application
systemctl stop dataaggregator-backend

# 2. Restore from latest backup
psql $DATABASE_URL < backups/database/latest.sql

# 3. Verify integrity
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"

# 4. Start application
systemctl start dataaggregator-backend
```

### System Locked Out

```bash
# If all admins locked out, use database access
psql $DATABASE_URL

# Reactivate admin
UPDATE users
SET is_active = true
WHERE username = 'admin';

# Reset admin password
UPDATE users
SET hashed_password = crypt('TempPass123', gen_salt('bf'))
WHERE username = 'admin';
```

## Useful Queries

### Find Users by Role
```sql
SELECT id, username, email, role, is_active, created_at
FROM users
WHERE role = 'admin'
ORDER BY created_at DESC;
```

### Recent Activity Summary
```sql
SELECT
  action,
  COUNT(*) as count,
  MAX(timestamp) as last_occurrence
FROM user_activity_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY action
ORDER BY count DESC;
```

### Database Size Summary
```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

**Emergency Contact**: [Add your team's contact info]
**Escalation Path**: [Add escalation procedure]
