# Phase 8 Deployment Guide

**Date**: October 12, 2025
**Phase**: 8 - Enhanced RBAC & System Maintenance

## Quick Start

### Environment Variables

Add to `.env`:
```bash
# Phase 8: RBAC & Security
ENVIRONMENT=production
CREATE_DEV_USER=false
AUTO_INIT_DB=false
ALLOW_DEV_ROLE_IN_PRODUCTION=false

# Existing variables
DATABASE_URL=postgresql://...
SECRET_KEY=<generate-strong-key>
```

### Database Migration

```bash
# 1. Backup existing database
pg_dump $DATABASE_URL > backup_pre_phase8.sql

# 2. Add system_settings table
poetry run alembic upgrade head

# 3. Verify tables
psql $DATABASE_URL -c "\dt system_settings"
```

### First-Time Setup

```bash
# 1. Start backend
cd backend
poetry install
poetry run uvicorn backend.main:app --reload

# 2. Login as admin
# Username: admin
# Password: password

# 3. IMMEDIATELY change admin password
# Go to Settings → Change Password

# 4. Create users with appropriate roles
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] Set `ENVIRONMENT=production`
- [ ] Set `CREATE_DEV_USER=false`
- [ ] Set `AUTO_INIT_DB=false`
- [ ] Generate strong `SECRET_KEY`
- [ ] Change admin password
- [ ] Test database backup/restore
- [ ] Configure CORS origins
- [ ] Set up SSL/TLS
- [ ] Enable rate limiting
- [ ] Configure monitoring

### Deployment Steps

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
poetry install --no-dev

# 3. Run migrations
poetry run alembic upgrade head

# 4. Restart service
systemctl restart dataaggregator-backend

# 5. Verify health
curl https://api.example.com/api/v1/health
```

### Post-Deployment Verification

```bash
# Test role-based access
curl -H "Authorization: Bearer $VIEWER_TOKEN" \
  https://api.example.com/api/v1/pipelines/  # Should work

curl -H "Authorization: Bearer $VIEWER_TOKEN" \
  -X POST https://api.example.com/api/v1/pipelines/  # Should fail 403

# Verify developer role blocked
curl -H "Authorization: Bearer $DEVELOPER_TOKEN" \
  https://api.example.com/api/v1/users/  # Should fail 403
```

## Rollback Procedure

If issues occur:

```bash
# 1. Restore database
psql $DATABASE_URL < backup_pre_phase8.sql

# 2. Revert code
git checkout <previous-commit>

# 3. Restart services
systemctl restart dataaggregator-backend

# 4. Verify system operational
```

## Maintenance Operations

### Schedule Cleanup

```bash
# Add to crontab (runs daily at 2 AM)
0 2 * * * curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8000/api/v1/admin/cleanup/all
```

### Monitor System

```bash
# Check cleanup stats
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8000/api/v1/admin/cleanup/stats

# View activity logs
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8000/api/v1/admin/activity-logs
```

## Troubleshooting

### Developer Role Blocked in Production

**Symptom**: "Developer role is not allowed in production"

**Solution**:
```bash
# Temporary enable (24h)
curl -X PUT -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"allow": true, "hours": 24}' \
  http://localhost:8000/api/v1/admin/settings/dev-role-production
```

### Cannot Reset Admin Password

**Symptom**: "Cannot reset password for admin user"

**Solution**: Use "Change Password" in Settings, requires current password

### Database Cleanup Failing

**Symptom**: Cleanup operations timing out

**Solution**:
```bash
# Run individual cleanup operations
curl -X POST http://localhost:8000/api/v1/admin/cleanup/activity-logs?days_to_keep=30
curl -X POST http://localhost:8000/api/v1/admin/cleanup/temp-files
```

---

**For detailed procedures, see**: `PHASE8_RUNBOOK.md`
