# Phase 7G: Enhanced User Management - Quick Start Guide

## 🚀 What's New

This update adds comprehensive user management features:

1. **Default Admin User** - Auto-created on first deployment
2. **Change Password** - Available to all users via user menu
3. **Admin User Management** - Activate/deactivate users, reset passwords
4. **Inactive User Restrictions** - Blocked users see informative page
5. **Activity Logging** - Complete audit trail for all user actions

---

## 🏁 Quick Start

### 1. Start the Application

```bash
# Start Docker services
docker compose up -d --build

# Services will be available at:
# - Backend: http://localhost:8001
# - Frontend: http://localhost:3000
# - Database: PostgreSQL on port 5432
```

### 2. Login as Admin

**Default Admin Credentials:**
- Username: `admin`
- Password: `password`

⚠️ **IMPORTANT**: Change this password immediately after first login!

### 3. Change Admin Password

1. Click on user menu (top right)
2. Select "Change Password"
3. Enter current password: `password`
4. Enter new password (min 8 chars, letters + numbers)
5. Confirm new password
6. Click "Change Password"

---

## 👤 User Management (Admin Only)

### Access User Management
Navigate to: **Users** page from sidebar

### User Management Actions

#### Reset User Password
1. Find user in the list
2. Click 🔑 (Key) icon
3. Confirm action
4. **Save the temporary password** displayed
5. Provide it to the user securely

#### Deactivate User
1. Find user in the list
2. Click ❌ (UserX) icon
3. Confirm action
4. User will be immediately locked out

#### Activate User
1. Find inactive user in the list
2. Click ✅ (UserCheck) icon
3. Confirm action
4. User can now login again

#### Delete User
1. Find user in the list
2. Click 🗑️ (Trash) icon
3. Confirm action
4. User permanently deleted

---

## 🔒 Security Features

### Password Requirements
- Minimum 8 characters
- Must contain letters
- Must contain numbers
- Real-time strength indicator

### Inactive User Experience
- Cannot access any application pages
- API requests return 403 Forbidden
- Shown informative "Account Inactive" page
- Admin contact information displayed

### Activity Logging
All actions are logged:
- Login/logout events
- Failed login attempts
- Password changes
- User management actions (create, update, activate, deactivate)
- IP address and user agent tracked

---

## 📊 Admin Activity Logs (API)

View activity logs via API:

```bash
# Get all activity logs
curl http://localhost:8001/api/v1/admin/activity-logs \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get logs for specific user
curl http://localhost:8001/api/v1/admin/activity-logs/1 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by action
curl "http://localhost:8001/api/v1/admin/activity-logs?action=login" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🧪 Testing Checklist

### Basic Flow
- [ ] Login with admin/password
- [ ] Change admin password
- [ ] Create new user (via registration or admin panel)
- [ ] Login as new user
- [ ] Change password as regular user
- [ ] Logout

### Admin Functions
- [ ] View all users
- [ ] Reset user password (get temporary password)
- [ ] Deactivate user
- [ ] Try to login as deactivated user (should see inactive page)
- [ ] Activate user again
- [ ] Delete user
- [ ] Verify activity logs capture actions

### Security
- [ ] Verify password strength requirements
- [ ] Try weak password (should fail)
- [ ] Try password without numbers (should fail)
- [ ] Verify inactive user cannot access API
- [ ] Verify inactive user sees correct page

---

## 🐛 Troubleshooting

### Admin User Not Created
```bash
# Check backend logs
docker compose logs backend | grep "admin"

# Should see: "Default admin user created - Username: admin, Password: password"
```

### Cannot Login
- Verify backend is running: `docker compose ps`
- Check backend health: `curl http://localhost:8001/health`
- Check database connection: `docker compose logs db`

### Activity Logs Not Showing
- Activity logs API requires admin role
- Check authentication token is valid
- Verify user has admin role

### Inactive User Not Blocked
- Check middleware is loaded in backend/main.py
- Verify user.is_active field in database
- Check backend logs for middleware errors

---

## 📁 Key Files

### Backend
- `backend/core/init_db.py` - Admin user seeding
- `backend/api/v1/endpoints/auth.py` - Change password endpoint
- `backend/api/v1/endpoints/users.py` - User management endpoints
- `backend/api/v1/endpoints/admin.py` - Activity log endpoints
- `backend/models/activity_log.py` - Activity log model
- `backend/services/activity_log_service.py` - Logging service
- `backend/middleware/inactive_user.py` - Inactive user middleware

### Frontend
- `frontend/src/components/auth/ChangePasswordModal.tsx` - Change password UI
- `frontend/src/app/account-inactive/page.tsx` - Inactive user page
- `frontend/src/app/users/page.tsx` - Enhanced user management
- `frontend/src/components/layout/header.tsx` - User menu with change password
- `frontend/src/lib/api.ts` - API client with new endpoints

---

## 🎯 Next Steps

1. **Deploy to Staging**
   - Test all features
   - Verify activity logging
   - Check performance

2. **Security Review**
   - Change default admin password
   - Review activity logs
   - Test inactive user restrictions

3. **Documentation**
   - Update API documentation
   - Create user guides
   - Document admin procedures

4. **Production Deploy**
   - Database migration (activity_logs table)
   - Deploy backend + frontend
   - Verify admin user creation
   - Monitor logs for issues

---

## 📞 Support

For issues or questions:
- Check logs: `docker compose logs -f backend`
- Review documentation: `docs/PHASE_7G_USER_MANAGEMENT_SUMMARY.md`
- API documentation: http://localhost:8001/docs

---

**Version**: Phase 7G
**Date**: October 9, 2025
**Status**: ✅ Ready for Testing
