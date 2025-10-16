# Phase 8 Addendum: Developer Role & Enhanced Security

**Date**: October 10, 2025 (Updated)
**Status**: 🚧 PLANNED
**Priority**: 🔴 HIGH

---

## Overview

This addendum document updates the Phase 8 Implementation Plan with the **Developer role** and associated security measures. This is the **6th role** in the system, designed specifically for development and testing activities.

---

## Developer Role Specification

### Purpose
The Developer role provides comprehensive system access for testing, debugging, and development activities while maintaining security boundaries around the admin account.

### Permissions

**Full Access (Nearly Admin-Level)**:
- ✅ User management (create, edit, assign roles, activate/deactivate)
- ✅ Pipeline design, execution, and monitoring (Designer + Executor combined)
- ✅ Full analytics and reporting access (Executive permissions)
- ✅ System cleanup and maintenance operations
- ✅ View and manage activity logs
- ✅ All feature access across the platform

**Restrictions (Admin User Only)**:
- ❌ Cannot change 'admin' user's role
- ❌ Cannot reset 'admin' user's password
- ❌ Cannot deactivate 'admin' user
- ❌ Cannot delete 'admin' user

**Assignment Control**:
- Only Admin can assign Developer role to users
- Only Admin can remove Developer role from users
- Developers cannot assign Developer role to others

### Use Case
- Manual testing of all application features
- Visual exploration and validation of UI
- Debugging production issues (with override in production)
- Development environment testing
- **NOT intended for production use**

---

## Default 'dev' User

### Specifications

```yaml
Username: dev
Password: dev12345
Role: developer
Initial Status: INACTIVE
Creation Trigger: CREATE_DEV_USER=true (environment variable)
```

### Security Measures

1. **Created Inactive**: Must be manually activated by admin
2. **Failed Login Masking**: Any failed login to 'dev' user returns "Invalid username or password" (never reveals existence)
3. **Environment-Specific**: Only created when `CREATE_DEV_USER=true`
4. **Development Only**: Should be deactivated/removed before production deployment

### Creation Logic

```python
# backend/core/init_db.py
import os
from backend.models.user import User
from backend.core.security import get_password_hash

def create_default_dev_user(db: Session):
    """Create default dev user if CREATE_DEV_USER is true"""
    if os.getenv("CREATE_DEV_USER", "false").lower() == "true":
        existing_dev = db.query(User).filter(User.username == "dev").first()
        if not existing_dev:
            dev_user = User(
                username="dev",
                email="dev@dataaggregator.local",
                hashed_password=get_password_hash("dev12345"),
                role="developer",
                is_active=False  # Initially inactive
            )
            db.add(dev_user)
            db.commit()
            logger.warning(
                "⚠️ Default 'dev' user created (INACTIVE). "
                "Activate manually for testing. "
                "REMOVE before production deployment!"
            )
```

---

## Production Safeguards

### Automatic Enforcement

When `ENVIRONMENT=production`:

1. **Prevent New Developer Assignments**
   - Block creating users with Developer role
   - Block assigning Developer role to existing users
   - Return error: "Developer role not allowed in production"

2. **Warning Indicators**
   - Dashboard shows alert if Developer role users exist
   - Activity logs flag Developer actions with WARNING level
   - Email notifications to admins about Developer activity

3. **Visual Warnings**
   - Prominent banner: "⚠️ Debug Mode Active - Developer access enabled"
   - Shown only to Admin and Developer roles
   - Countdown timer showing auto-expiration

### Admin Override

**Database Setting**: `ALLOW_DEV_ROLE_IN_PRODUCTION`

```sql
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    expires_at TIMESTAMP,
    updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Example record
INSERT INTO system_settings (setting_key, setting_value, expires_at, updated_by)
VALUES ('ALLOW_DEV_ROLE_IN_PRODUCTION', 'false', NULL, 1);
```

**Admin UI Toggle**:
- Located in Admin Settings panel
- Requires admin authentication
- Shows warning dialog before enabling
- Sets 24-hour auto-expiration by default
- Sends notifications to all admins

**API Endpoint**:
```
PUT /api/v1/admin/settings/dev-role-production
Body: {
  "enabled": true,
  "expiration_hours": 24
}
Response: {
  "enabled": true,
  "expires_at": "2025-10-11T14:30:00Z",
  "warning": "Developer role enabled in production. Auto-expires in 24 hours."
}
```

---

## Updated Permission Matrix

| Feature/Endpoint | Admin | Developer | Designer | Executor | Viewer | Executive |
|-----------------|-------|-----------|----------|----------|--------|-----------|
| **User Management** |
| View users | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create users | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit users | ✅ | ✅* | ❌ | ❌ | ❌ | ❌ |
| Delete users | ✅ | ✅* | ❌ | ❌ | ❌ | ❌ |
| Assign roles | ✅ | ✅* | ❌ | ❌ | ❌ | ❌ |
| Assign Developer role | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Modify admin user | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Pipeline Management** |
| View pipelines | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create pipelines | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit pipelines | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete pipelines | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Execute pipelines | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **System Administration** |
| View activity logs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| System cleanup | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| System configuration | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Database maintenance | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Production safeguard override | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

*Developer role restrictions apply to 'admin' user only

---

## Implementation Changes

### Backend Files Modified/Created

1. **`backend/models/user.py`**
   - Add 'developer' to Role enum
   - Set default role to 'viewer'

2. **`backend/core/init_db.py`**
   - Add CREATE_DEV_USER check
   - Implement create_default_dev_user()

3. **`backend/models/system_settings.py`** (NEW)
   - SystemSettings model for ALLOW_DEV_ROLE_IN_PRODUCTION

4. **`backend/middleware/admin_protection.py`** (NEW)
   - Middleware to protect admin user from Developer modifications

5. **`backend/middleware/dev_role_protection.py`** (NEW)
   - Middleware to enforce production safeguards

6. **`backend/api/v1/endpoints/auth.py`**
   - Update login to mask 'dev' user failures

7. **`backend/api/v1/endpoints/users.py`**
   - Add admin user protection checks
   - Implement Developer role assignment restrictions

8. **`backend/api/v1/endpoints/settings.py`** (NEW)
   - Admin settings endpoints for production override

9. **`backend/core/permissions.py`** (NEW)
   - Permission service with Developer role handling

### Frontend Files Modified/Created

1. **`frontend/src/components/layout/DevWarningBanner.tsx`** (NEW)
   - Warning banner for Developer mode in production

2. **`frontend/src/app/admin/settings/page.tsx`** (NEW or UPDATE)
   - Production safeguard toggle UI

3. **`frontend/src/app/users/page.tsx`**
   - Update to handle 6 roles
   - Admin user protection indicators
   - Developer role assignment warnings

4. **`frontend/src/components/layout/Sidebar.tsx`**
   - Developer role navigation (same as Admin)

5. **`frontend/src/hooks/usePermissions.ts`** (NEW or UPDATE)
   - Permission checking for 6 roles

### Environment Variables

**New Variables**:
```bash
# .env.example
CREATE_DEV_USER=true          # Create default dev user (development only)
ENVIRONMENT=development       # Environment: development, staging, production
```

---

## Testing Checklist

### Developer Role Tests
- [ ] Developer can access all features except admin user modifications
- [ ] Developer cannot change admin user's role
- [ ] Developer cannot reset admin user's password
- [ ] Developer cannot deactivate admin user
- [ ] Developer cannot delete admin user
- [ ] Developer cannot assign Developer role to others
- [ ] Admin can assign/remove Developer role

### Default 'dev' User Tests
- [ ] 'dev' user created when CREATE_DEV_USER=true
- [ ] 'dev' user NOT created when CREATE_DEV_USER=false
- [ ] 'dev' user initially inactive
- [ ] Failed login to 'dev' always shows "Invalid username or password"
- [ ] 'dev' user has Developer role assigned
- [ ] Admin can activate 'dev' user

### Production Safeguard Tests
- [ ] Developer role assignment blocked in production (without override)
- [ ] ALLOW_DEV_ROLE_IN_PRODUCTION can be toggled by admin
- [ ] Warning banner appears when enabled
- [ ] Warning visible only to Admin and Developer roles
- [ ] Auto-expiration works after 24 hours
- [ ] Notifications sent to admins when enabled
- [ ] Activity logs record all Developer actions with WARNING

### Default Role Tests
- [ ] New users default to Viewer role
- [ ] Registration creates user with Viewer role
- [ ] Admin-created users default to Viewer role

---

## Security Considerations

### Risks

1. **Risk**: Developer role has excessive permissions
   - **Mitigation**: Cannot modify admin user, production safeguards

2. **Risk**: Default 'dev' credentials known
   - **Mitigation**: Initially inactive, masked failures, environment-gated

3. **Risk**: Developer access in production
   - **Mitigation**: Automatic blocking, override requires admin, time-limited, full audit trail

4. **Risk**: Developers self-elevating permissions
   - **Mitigation**: Only Admin can assign Developer role

### Best Practices

1. ✅ Always deactivate 'dev' user before production deployment
2. ✅ Remove CREATE_DEV_USER from production environment files
3. ✅ Monitor activity logs for Developer role actions in production
4. ✅ Set short expiration times for production override (4-8 hours max)
5. ✅ Immediately revoke override after debugging complete
6. ✅ Use separate test accounts instead of 'dev' when possible

---

## Migration Guide

### Database Migration

```sql
-- Add developer role to enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'developer';

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    expires_at TIMESTAMP,
    updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default production safeguard setting
INSERT INTO system_settings (setting_key, setting_value)
VALUES ('ALLOW_DEV_ROLE_IN_PRODUCTION', 'false')
ON CONFLICT (setting_key) DO NOTHING;

-- Update existing users without role to viewer
UPDATE users
SET role = 'viewer'
WHERE role IS NULL OR role = '';
```

### Configuration Updates

Update `.env` files:
```bash
# Development
CREATE_DEV_USER=true
ENVIRONMENT=development

# Staging
CREATE_DEV_USER=false
ENVIRONMENT=staging

# Production
CREATE_DEV_USER=false
ENVIRONMENT=production
```

---

## API Endpoints Summary

### New Endpoints

```
GET    /api/v1/roles
       Response: List of all 6 roles with descriptions

GET    /api/v1/roles/developer/permissions
       Response: Developer role permission details

PUT    /api/v1/admin/settings/dev-role-production
       Body: { enabled: boolean, expiration_hours: number }
       Response: { enabled, expires_at, warning }

GET    /api/v1/admin/settings/dev-role-production
       Response: Current production override status
```

---

## Documentation Updates

### Files to Update
1. ✅ PRD.md - Updated with Developer role (FR-5.3.2, FR-5.3.6, FR-5.3.11)
2. ✅ IMPLEMENTATION_TASKS.md - Updated Phase 8 tasks
3. ⏳ PHASE_8_IMPLEMENTATION_PLAN.md - Needs Developer role section
4. ⏳ README.md - Update to mention 6 roles
5. ⏳ .env.example - Add CREATE_DEV_USER variable
6. ⏳ docs/security.md - Update RBAC matrix with Developer role

---

## Summary of Changes

### Roles: 5 → 6
- Admin
- **Developer** (NEW)
- Designer
- Executor
- Viewer
- Executive

### Default Users: 1 → 2
- admin (always created)
- **dev** (conditional: CREATE_DEV_USER=true)

### New Features
- Production safeguards for Developer role
- Admin user protection from Developer modifications
- Failed login masking for 'dev' user
- Time-limited production override with audit trail
- Default Viewer role for new users

---

**Last Updated**: October 10, 2025
**Status**: Ready for implementation in Phase 8
