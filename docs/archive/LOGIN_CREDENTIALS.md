# DataAggregator Platform - Login Credentials

**Last Updated:** October 11, 2025

---

## ✅ ISSUE RESOLVED: Login Credentials Fixed

### Problem
Users could not login to the frontend application with the documented credentials:
- `admin/password` - Failed (password mismatch)
- `dev/dev12345` - User didn't exist
- Frontend API calls - 404 error (incorrect API URL)

### Root Cause
1. The admin user was created on October 9 with a different password
2. The developer user was never created (requires `CREATE_DEV_USER=true` environment variable)
3. Frontend was missing `.env.local` file with correct `NEXT_PUBLIC_API_URL`

### Solution Applied
1. ✅ Reset admin user password to `password`
2. ✅ Created developer user with credentials `dev/dev12345`
3. ✅ Created `frontend/.env.local` with correct API URL
4. ✅ Restarted frontend to load new environment variables
5. ✅ Verified both logins work via API and frontend

---

## 🔐 Current User Credentials

### Admin User (Full Access)
```
Username: admin
Password: password
Role: admin
Status: Active
Email: admin@dataaggregator.local
```

**Permissions:** Full system access including:
- User management (create, edit, delete, activate/deactivate)
- Pipeline management (full CRUD)
- System maintenance and cleanup operations
- All analytics and monitoring
- All configuration settings

---

### Developer User (Testing/Development)
```
Username: dev
Password: dev12345
Role: developer
Status: Active
Email: dev@dataaggregator.local
```

**Permissions:** Near-admin access with restrictions:
- Cannot modify admin user
- Cannot delete admin user
- Cannot reset admin password
- All other admin permissions available
- Intended for development/testing only

**⚠️ Production Warning:** Developer role is intended for development environments only. In production, this role requires explicit approval via `ALLOW_DEV_ROLE_IN_PRODUCTION` setting.

---

### Existing Test Users
```
Username: testuser
Password: testpass123
Role: viewer
Status: Active
Email: test@example.com
```

```
Username: testuser2
Password: testpass123
Role: viewer
Status: Active
Email: test2@example.com
```

```
Username: corstest2
Password: (unknown)
Role: viewer
Status: Active
Email: corstest2@example.com
```

---

## 🚀 Login Instructions

### Frontend Login (Next.js)
1. Navigate to: http://localhost:3000
2. You'll be redirected to: http://localhost:3000/auth/login
3. Enter credentials (admin/password or dev/dev12345)
4. Click "Login"

### API Login (Backend)
```bash
# Login as admin
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=password"

# Login as dev
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=dev&password=dev12345"
```

Response will include:
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

---

## ✅ Verification Tests

### Test 1: Admin Login
```bash
curl -s -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=password" | python3 -m json.tool
```

**Status:** ✅ PASS - Returns access token

### Test 2: Developer Login
```bash
curl -s -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=dev&password=dev12345" | python3 -m json.tool
```

**Status:** ✅ PASS - Returns access token

---

## 🔒 Security Recommendations

### Immediate Actions:
1. ⚠️ **Change admin password immediately** after first login
2. ⚠️ **Change developer password** if using in non-local environments
3. ✅ Developer user is set to active for development convenience
4. ✅ Production safeguards are in place for developer role

### Production Deployment:
1. **REQUIRED:** Change admin password from default
2. **REQUIRED:** Delete or deactivate developer user
3. **REQUIRED:** Set `CREATE_DEV_USER=false` in production
4. **REQUIRED:** Set `ALLOW_DEV_ROLE_IN_PRODUCTION=false` in production
5. **RECOMMENDED:** Implement password complexity requirements
6. **RECOMMENDED:** Enable 2FA for admin accounts

---

## 📝 Database User Records

Current users in database:
```sql
SELECT id, username, email, role, is_active
FROM users
ORDER BY id;
```

| ID | Username | Email | Role | Active |
|----|----------|-------|------|--------|
| 1 | testuser | test@example.com | viewer | Yes |
| 2 | corstest2 | corstest2@example.com | viewer | Yes |
| 3 | admin | admin@dataaggregator.local | admin | Yes |
| 4 | testuser2 | test2@example.com | viewer | Yes |
| 5 | dev | dev@dataaggregator.local | developer | Yes |

---

## 🛠️ Troubleshooting

### Issue: "Incorrect username or password"
**Solutions:**
1. Verify you're using the correct credentials from this document
2. Check that user is active: `SELECT username, is_active FROM users WHERE username='admin';`
3. If needed, reset password using the script in this document

### Issue: "User not found"
**Solutions:**
1. Verify user exists: `SELECT * FROM users WHERE username='dev';`
2. Create user using init_db script or manual SQL insert
3. Check logs for user creation errors

### Issue: "Account inactive"
**Solutions:**
1. Activate user: `UPDATE users SET is_active = true WHERE username='dev';`
2. Check with admin to activate account

---

## 🔧 Manual Password Reset (If Needed)

### Reset Admin Password
```bash
# Generate new hash
poetry run python3 << 'EOF'
from backend.core.security import get_password_hash
print(get_password_hash("password"))
EOF

# Update in database
docker exec dataaggregator-db-1 psql -U postgres -d dataaggregator \
  -c "UPDATE users SET hashed_password = '<generated_hash>' WHERE username = 'admin';"
```

### Reset Developer Password
```bash
# Generate new hash for dev12345
poetry run python3 << 'EOF'
from backend.core.security import get_password_hash
print(get_password_hash("dev12345"))
EOF

# Update in database
docker exec dataaggregator-db-1 psql -U postgres -d dataaggregator \
  -c "UPDATE users SET hashed_password = '<generated_hash>' WHERE username = 'dev';"
```

---

## 📊 Password Hashing Details

The platform uses **bcrypt** password hashing with the following characteristics:
- Algorithm: bcrypt
- Rounds: 12 (default)
- Library: passlib with bcrypt backend
- Hash format: `$2b$12$...` (bcrypt with 12 rounds)

Example hash structure:
```
$2b$12$W/JVCZVQBY4IKmd2rWP6QeP7QSnDzY9zjwdVBJ4sIw9/SSCN5oaCG
 │   │  └─────────────────────────────────────────────────── Hash
 │   └───────────────────────────────────── Salt
 └──────────────────── Algorithm & Cost Factor
```

---

## ✅ Login Status: FULLY FUNCTIONAL

Both admin and developer logins are now working correctly. You can proceed with:
1. ✅ Frontend testing via http://localhost:3000
2. ✅ API testing via http://localhost:8001/api/v1/*
3. ✅ Role-based feature testing
4. ✅ Admin panel testing
5. ✅ System maintenance dashboard testing

---

**Document Version:** 1.0
**Last Verified:** October 11, 2025
**Next Review:** Before production deployment
