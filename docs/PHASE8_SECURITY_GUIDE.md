# Phase 8 Security Guide

**Date**: October 12, 2025
**Version**: 1.1.0
**Phase**: 8 - Enhanced RBAC & System Maintenance

## Table of Contents

1. [Overview](#overview)
2. [Role-Based Access Control](#role-based-access-control)
3. [Admin User Protection](#admin-user-protection)
4. [Developer Role Safeguards](#developer-role-safeguards)
5. [Password Security](#password-security)
6. [Database Security](#database-security)
7. [Production Security](#production-security)
8. [Audit & Compliance](#audit--compliance)
9. [Security Best Practices](#security-best-practices)
10. [Incident Response](#incident-response)

---

## Overview

Phase 8 introduces comprehensive security enhancements including a 6-role RBAC system, admin user protection, production safeguards, and enhanced audit capabilities.

### Security Principles

1. **Principle of Least Privilege**: Users granted minimum necessary permissions
2. **Defense in Depth**: Multiple layers of security controls
3. **Separation of Duties**: Critical operations require specific roles
4. **Audit Trail**: All security-relevant actions logged
5. **Secure by Default**: Restrictive permissions out-of-the-box

---

## Role-Based Access Control

### Role Hierarchy

```
┌─────────────────────────────────────────┐
│ Admin (Level 6)                         │  ← Full System Control
├─────────────────────────────────────────┤
│ Developer (Level 5)                     │  ← Development Only
├─────────────────────────────────────────┤
│ Executive (Level 4)                     │  ← Business Intelligence
├─────────────────────────────────────────┤
│ Designer (Level 3)                      │  ← Pipeline Design
├─────────────────────────────────────────┤
│ Executor (Level 2)                      │  ← Operations
├─────────────────────────────────────────┤
│ Viewer (Level 1)                        │  ← Read-Only (Default)
└─────────────────────────────────────────┘
```

### Role Security Boundaries

#### Admin Role
- **Purpose**: System administration and user management
- **Security**: Cannot be deleted or deactivated
- **Audit**: All admin actions logged with HIGH severity
- **Restrictions**: Password reset requires current password

#### Developer Role
- **Purpose**: Development and debugging (non-production)
- **Security**: Automatically blocked in production unless explicitly enabled
- **Restrictions**:
  - Cannot modify admin user
  - Cannot assign Admin or Developer roles
  - Activity logged with WARNING level in production
- **Safeguard**: Auto-expires in production after 24 hours (configurable)

#### Designer Role
- **Purpose**: Pipeline and workflow design
- **Security**: Cannot execute pipelines (separation of duties)
- **Audit**: All design changes logged

#### Executor Role
- **Purpose**: Pipeline execution and monitoring
- **Security**: Cannot modify configurations
- **Audit**: All executions logged

#### Executive Role
- **Purpose**: Business intelligence and reporting
- **Security**: Read-only access to analytics
- **Audit**: Data exports logged

#### Viewer Role
- **Purpose**: Monitoring and observation
- **Security**: Completely read-only
- **Default**: All new users start as Viewer

### Role Assignment Security

```typescript
// Only Admin can assign these roles
SENSITIVE_ROLES = [Admin, Developer]

// Developer can assign these roles
STANDARD_ROLES = [Designer, Executor, Executive, Viewer]

// Validation
if (current_role == DEVELOPER && new_role in SENSITIVE_ROLES) {
    throw ForbiddenError("Cannot assign sensitive roles")
}
```

---

## Admin User Protection

### Built-in Admin Account

The default `admin` account has special protections:

#### Restrictions

1. **Cannot be deleted**: System prevents deletion
2. **Cannot be deactivated**: Always active
3. **Role cannot be changed**: Always remains admin
4. **Protected from Developer**: Developer role cannot modify
5. **Password reset protection**: Must use "Change Password"

#### Implementation

```python
# Admin protection middleware
def check_admin_user_protection(current_user, target_username):
    if is_admin_user(target_username):
        if current_user.role == UserRole.DEVELOPER:
            raise HTTPException(
                status_code=403,
                detail="Developer role cannot modify admin user"
            )
```

#### Security Implications

- **Single Point of Failure**: Protect admin credentials carefully
- **Last Resort Access**: Admin can always regain control
- **Audit Critical**: All admin account actions logged

### Admin Password Management

```plaintext
Admin Password Security:
┌────────────────────────────────────┐
│ Password Change (Allowed)          │
│ - Via Settings → Change Password   │
│ - Requires current password        │
│ - Email notification sent          │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ Password Reset (Blocked)           │
│ - Admin user cannot use reset      │
│ - Prevents unauthorized access     │
│ - Error: "Use Change Password"     │
└────────────────────────────────────┘
```

---

## Developer Role Safeguards

### Production Environment Protection

The Developer role is designed for development environments only.

#### Automatic Blocking

```python
# Production environment check
if ENVIRONMENT == "production" and user.role == DEVELOPER:
    if not ALLOW_DEV_ROLE_IN_PRODUCTION:
        raise HTTPException(
            status_code=403,
            detail="Developer role blocked in production"
        )
```

#### Override Mechanism

For emergency debugging in production:

1. **Admin enables**: Via UI Settings panel
2. **Time-limited**: Auto-expires after 24 hours (default)
3. **Fully audited**: All actions logged with WARNING
4. **Visible warning**: Banner shown to all admins
5. **Email notification**: Sent when enabled/disabled

#### Security Flow

```
┌─────────────────────────────────────────────┐
│ Developer Login in Production               │
└───────────────┬─────────────────────────────┘
                │
                ├──→ Check ALLOW_DEV_ROLE_IN_PRODUCTION
                │
                ├──→ If FALSE: Block access (403)
                │
                ├──→ If TRUE: Check expiration
                │
                ├──→ If expired: Auto-disable & block
                │
                └──→ If valid: Allow with WARNING logs
```

### Developer Role Restrictions

```python
# Operations blocked for Developer on admin user
BLOCKED_OPERATIONS = [
    "modify_admin_user",
    "delete_admin_user",
    "reset_admin_password",
    "deactivate_admin_user",
    "change_admin_role"
]

# Roles Developer cannot assign
FORBIDDEN_ROLE_ASSIGNMENTS = [
    UserRole.ADMIN,
    UserRole.DEVELOPER
]
```

---

## Password Security

### Password Requirements

```yaml
Minimum Requirements:
  - Length: 8 characters minimum
  - Complexity: Mix of letters and numbers
  - No common passwords: Checked against dictionary
  - No username in password
  - No recently used passwords (last 5)

Recommendations:
  - Length: 12+ characters
  - Mix: Uppercase, lowercase, numbers, symbols
  - Unique: Different for each account
  - Manager: Use password manager
```

### Password Storage

```python
# Hashing with bcrypt
hashed_password = bcrypt.hashpw(
    password.encode('utf-8'),
    bcrypt.gensalt(rounds=12)
)

# Never store plaintext passwords
# Never log passwords
# Never return passwords in API responses
```

### Password Reset Flow

```
┌────────────────────────────────────────────┐
│ Standard User Password Reset               │
├────────────────────────────────────────────┤
│ 1. Admin/Developer initiates reset        │
│ 2. System generates temp password (12ch)  │
│ 3. Password returned to admin             │
│ 4. Admin provides to user securely       │
│ 5. User changes password on first login  │
│ 6. Activity logged                        │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ Admin User Password Change                 │
├────────────────────────────────────────────┤
│ 1. Admin uses "Change Password"           │
│ 2. Current password required              │
│ 3. New password validated                 │
│ 4. Email notification sent                │
│ 5. Activity logged                        │
└────────────────────────────────────────────┘
```

### Password Reset Protection

```python
# Admin password reset blocked
def check_can_reset_password(current_user, target_username):
    if is_admin_user(target_username):
        raise HTTPException(
            status_code=403,
            detail="Cannot reset admin password via this endpoint"
        )
```

---

## Database Security

### Initialization Safeguards

```python
# Database initialization checks
async def init_db(db: AsyncSession, force: bool = False):
    # 1. Check if data exists
    has_data = await check_database_has_data(db)

    # 2. If production, block automatic init
    if has_data and ENVIRONMENT == "production":
        logger.error("BLOCKED: Database has data in production")
        return

    # 3. Create backup before init
    if has_data:
        create_database_backup()

    # 4. Initialize with default users
    await create_default_admin(db)
    await create_developer_user(db)  # Only if CREATE_DEV_USER=true
```

### Backup Security

```bash
# Backup location
BACKUP_DIR=/backups/database/

# Backup naming
backup_YYYYMMDD_HHMMSS.sql

# Permissions
chmod 600 backup_*.sql
chown postgres:postgres backup_*.sql

# Retention
- Keep last 30 days of daily backups
- Keep last 12 months of monthly backups
- Archive older backups securely
```

### Cleanup Operations

```python
# Cleanup requires Developer+ role
@router.post("/cleanup/all")
async def cleanup_all(
    current_user: User = Depends(require_developer())
):
    # Always backup before major cleanup
    create_database_backup("pre_cleanup_backup")

    # Run cleanup operations
    result = await CleanupService.clean_all(db)

    # Log cleanup operation
    await log_cleanup_operation(current_user, result)

    return result
```

---

## Production Security

### Environment Validation

```bash
# Required environment variables
ENVIRONMENT=production
SECRET_KEY=<strong-random-key>
POSTGRES_PASSWORD=<strong-password>

# Security flags
AUTO_INIT_DB=false  # Prevent accidental DB reset
CREATE_DEV_USER=false  # No dev user in production
ALLOW_DEV_ROLE_IN_PRODUCTION=false  # Block developer role

# CORS settings
BACKEND_CORS_ORIGINS=["https://app.example.com"]  # Specific origins only
```

### Production Checklist

#### Pre-Deployment Security

- [ ] Change default admin password
- [ ] Set strong SECRET_KEY
- [ ] Disable AUTO_INIT_DB
- [ ] Disable CREATE_DEV_USER
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS only
- [ ] Set up firewall rules
- [ ] Configure rate limiting
- [ ] Enable security headers
- [ ] Set up monitoring & alerts

#### Post-Deployment Verification

- [ ] Verify admin login works
- [ ] Verify developer role blocked
- [ ] Test role-based access
- [ ] Verify backup system working
- [ ] Check activity log recording
- [ ] Test password reset flow
- [ ] Verify email notifications
- [ ] Check cleanup operations

### Security Headers

```python
# Security middleware configuration
SECURITY_HEADERS = {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'self'",
    "Referrer-Policy": "strict-origin-when-cross-origin"
}
```

---

## Audit & Compliance

### Activity Logging

All security-relevant events are logged:

```python
# Logged Events
SECURITY_EVENTS = [
    "user_login",
    "user_logout",
    "login_failed",
    "password_changed",
    "password_reset",
    "user_created",
    "user_updated",
    "user_activated",
    "user_deactivated",
    "role_changed",
    "admin_user_access_attempt",
    "developer_role_enabled",
    "cleanup_operation",
    "database_backup",
    "unauthorized_access"
]
```

### Log Retention

```yaml
Activity Logs:
  Standard: 90 days
  Security Events: 1 year
  Audit Events: 7 years (compliance)

Execution Logs:
  Standard: 30 days
  Failures: 90 days

System Logs:
  Standard: 30 days
  Errors: 90 days
```

### Compliance Reports

```python
# Generate compliance report
async def generate_compliance_report(start_date, end_date):
    return {
        "user_management": {
            "users_created": count_user_created_events(),
            "users_modified": count_user_modified_events(),
            "failed_logins": count_failed_logins()
        },
        "admin_activity": {
            "admin_logins": count_admin_logins(),
            "admin_actions": get_admin_actions()
        },
        "developer_access": {
            "production_access": count_dev_production_access(),
            "duration": calculate_dev_access_duration()
        },
        "data_access": {
            "exports": count_data_exports(),
            "analytics_access": count_analytics_views()
        }
    }
```

---

## Security Best Practices

### User Management

1. **Default to Viewer**: Always start with minimum access
2. **Regular Reviews**: Audit user roles quarterly
3. **Remove Inactive**: Deactivate unused accounts after 90 days
4. **Strong Passwords**: Enforce password requirements
5. **Multi-Factor**: Consider MFA for admin accounts

### Role Assignment

1. **Principle of Least Privilege**: Grant minimum necessary role
2. **Time-Limited Access**: Use temporary elevated access when needed
3. **Separation of Duties**: Don't combine Designer + Executor in one user
4. **Document Decisions**: Record reason for role assignments
5. **Regular Rotation**: Rotate sensitive role assignments

### Production Operations

1. **No Developer Role**: Keep developer role disabled in production
2. **Emergency Access Only**: Enable developer role only for emergencies
3. **Time Limits**: Always set expiration for temporary access
4. **Audit Everything**: Review all production access attempts
5. **Alert on Anomalies**: Monitor unusual access patterns

### Database Operations

1. **Backup Before Cleanup**: Always backup before major operations
2. **Test Restores**: Regularly test backup restoration
3. **Encrypt Backups**: Encrypt backup files at rest
4. **Secure Storage**: Store backups in secure, separate location
5. **Access Control**: Limit backup file access to admins only

---

## Incident Response

### Security Incident Types

```yaml
Severity Levels:
  CRITICAL:
    - Unauthorized admin access
    - Data breach
    - System compromise

  HIGH:
    - Failed admin login attempts
    - Role escalation attempt
    - Developer role enabled in production

  MEDIUM:
    - Multiple failed login attempts
    - Unusual access patterns
    - Unauthorized API calls

  LOW:
    - Single failed login
    - Policy violation
    - Configuration warning
```

### Response Procedures

#### Unauthorized Access Attempt

1. **Detect**: Monitor for failed authentication
2. **Alert**: Notify security team
3. **Investigate**: Check activity logs
4. **Block**: Deactivate compromised accounts
5. **Remediate**: Reset passwords, review permissions
6. **Document**: Record incident details

#### Developer Role Misuse

1. **Detect**: Monitor developer role usage in production
2. **Alert**: Notify admin team
3. **Investigate**: Review all actions performed
4. **Disable**: Immediately disable ALLOW_DEV_ROLE_IN_PRODUCTION
5. **Audit**: Complete audit of changes made
6. **Remediate**: Revert unauthorized changes

#### Data Exfiltration Attempt

1. **Detect**: Monitor large data exports
2. **Alert**: Notify security and compliance teams
3. **Block**: Suspend user account
4. **Investigate**: Review exported data scope
5. **Report**: File incident report
6. **Remediate**: Enhance export controls

---

## Security Monitoring

### Key Metrics

```python
# Security dashboard metrics
SECURITY_METRICS = {
    "failed_login_rate": "failed_logins / total_login_attempts",
    "developer_production_time": "hours_dev_role_active_in_prod",
    "admin_action_frequency": "admin_actions / hour",
    "role_change_frequency": "role_changes / day",
    "unusual_access_patterns": "access_outside_business_hours",
    "data_export_volume": "mb_exported / day"
}
```

### Alerting Rules

```yaml
Alerts:
  - Rule: failed_logins > 5 in 10 minutes
    Severity: HIGH
    Action: Lock account, notify admin

  - Rule: developer_role_enabled in production
    Severity: HIGH
    Action: Email all admins immediately

  - Rule: admin_password_reset_attempt
    Severity: CRITICAL
    Action: Block operation, alert security team

  - Rule: unusual_data_export (>1GB)
    Severity: MEDIUM
    Action: Log for review, notify compliance

  - Rule: off_hours_admin_access
    Severity: LOW
    Action: Log for review
```

---

## Conclusion

Phase 8 security enhancements provide defense-in-depth protection through:

- ✅ Granular 6-role RBAC system
- ✅ Admin user protection
- ✅ Developer role safeguards
- ✅ Production environment controls
- ✅ Comprehensive audit trail
- ✅ Database security measures

**Remember**: Security is an ongoing process. Regularly review this guide, audit configurations, and update procedures as threats evolve.

---

**Last Updated**: October 12, 2025
**Next Review**: January 12, 2026
