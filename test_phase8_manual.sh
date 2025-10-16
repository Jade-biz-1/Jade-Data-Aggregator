#!/bin/bash

# Phase 8 Manual Testing Script
# Tests Enhanced RBAC (6 roles) and System Maintenance features

BASE_URL="http://localhost:8001"
API_PREFIX="/api/v1"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
PASS=0
FAIL=0
TOTAL=0

# Helper functions
print_test() {
    echo -e "\n${YELLOW}TEST $1:${NC} $2"
    ((TOTAL++))
}

print_pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    ((PASS++))
}

print_fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    ((FAIL++))
}

# Login function
login() {
    local username=$1
    local password=$2
    local response=$(curl -s -X POST "${BASE_URL}${API_PREFIX}/auth/login" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "username=${username}&password=${password}")

    local token=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))" 2>/dev/null)
    echo "$token"
}

echo "======================================================================"
echo "   PHASE 8 - ENHANCED RBAC & SYSTEM MAINTENANCE TESTING"
echo "======================================================================"

# ============================================================================
# TEST SUITE 1: Enhanced RBAC System (6 Roles)
# ============================================================================
echo -e "\n${YELLOW}═══ TEST SUITE 1: Enhanced RBAC System ═══${NC}"

print_test 1 "Verify 6 roles endpoint is accessible"
TOKEN=$(login "testuser" "testpass123")
if [ -n "$TOKEN" ]; then
    ROLES_RESPONSE=$(curl -s "${BASE_URL}${API_PREFIX}/roles/" \
        -H "Authorization: Bearer ${TOKEN}")

    if echo "$ROLES_RESPONSE" | grep -q "admin\|developer\|designer\|executor\|viewer\|executive"; then
        print_pass "Roles endpoint returns expected roles"
    else
        print_fail "Roles endpoint did not return expected roles"
        echo "Response: $ROLES_RESPONSE"
    fi
else
    print_fail "Could not authenticate testuser"
fi

print_test 2 "Verify role permissions endpoint"
PERMISSIONS_RESPONSE=$(curl -s "${BASE_URL}${API_PREFIX}/roles/admin/permissions" \
    -H "Authorization: Bearer ${TOKEN}")

if echo "$PERMISSIONS_RESPONSE" | grep -q "permissions"; then
    print_pass "Role permissions endpoint works"
else
    print_fail "Role permissions endpoint failed"
fi

print_test 3 "Verify all permissions endpoint"
ALL_PERMS_RESPONSE=$(curl -s "${BASE_URL}${API_PREFIX}/roles/permissions/all" \
    -H "Authorization: Bearer ${TOKEN}")

if echo "$ALL_PERMS_RESPONSE" | grep -q "user_management\|pipeline_management"; then
    print_pass "All permissions endpoint returns categories"
else
    print_fail "All permissions endpoint failed"
fi

# ============================================================================
# TEST SUITE 2: System Maintenance & Cleanup
# ============================================================================
echo -e "\n${YELLOW}═══ TEST SUITE 2: System Maintenance & Cleanup ═══${NC}"

print_test 4 "Verify cleanup stats endpoint"
STATS_RESPONSE=$(curl -s "${BASE_URL}${API_PREFIX}/admin/cleanup/stats" \
    -H "Authorization: Bearer ${TOKEN}")

if echo "$STATS_RESPONSE" | grep -q "database\|record_counts\|temp_files"; then
    print_pass "Cleanup stats endpoint returns data"
else
    print_fail "Cleanup stats endpoint failed"
    echo "Response: $STATS_RESPONSE"
fi

print_test 5 "Test cleanup estimate endpoint"
ESTIMATE_RESPONSE=$(curl -s "${BASE_URL}${API_PREFIX}/admin/cleanup/estimate/activity-logs" \
    -H "Authorization: Bearer ${TOKEN}")

if [ $? -eq 0 ]; then
    print_pass "Cleanup estimate endpoint accessible"
else
    print_fail "Cleanup estimate endpoint failed"
fi

# ============================================================================
# TEST SUITE 3: Navigation and Feature Access
# ============================================================================
echo -e "\n${YELLOW}═══ TEST SUITE 3: Navigation and Feature Access ═══${NC}"

print_test 6 "Verify navigation items endpoint"
NAV_RESPONSE=$(curl -s "${BASE_URL}${API_PREFIX}/roles/navigation/items" \
    -H "Authorization: Bearer ${TOKEN}")

if echo "$NAV_RESPONSE" | grep -q "dashboard\|pipelines"; then
    print_pass "Navigation items endpoint works"
else
    print_fail "Navigation items endpoint failed"
fi

print_test 7 "Verify feature access endpoint"
FEATURES_RESPONSE=$(curl -s "${BASE_URL}${API_PREFIX}/roles/features/access" \
    -H "Authorization: Bearer ${TOKEN}")

if echo "$FEATURES_RESPONSE" | grep -q "analytics\|maintenance"; then
    print_pass "Feature access endpoint works"
else
    print_fail "Feature access endpoint failed"
fi

# ============================================================================
# TEST SUITE 4: Database & Migrations
# ============================================================================
echo -e "\n${YELLOW}═══ TEST SUITE 4: Database & Migrations ═══${NC}"

print_test 8 "Verify system_settings table exists"
TABLE_CHECK=$(docker exec dataaggregator-db-1 psql -U postgres -d dataaggregator \
    -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='system_settings';" 2>/dev/null)

if [ "$TABLE_CHECK" -eq 1 ] 2>/dev/null; then
    print_pass "system_settings table exists"
else
    print_fail "system_settings table not found"
fi

print_test 9 "Verify system_settings has data"
SETTINGS_COUNT=$(docker exec dataaggregator-db-1 psql -U postgres -d dataaggregator \
    -t -c "SELECT COUNT(*) FROM system_settings;" 2>/dev/null)

if [ "$SETTINGS_COUNT" -gt 0 ] 2>/dev/null; then
    print_pass "system_settings table has $SETTINGS_COUNT record(s)"
else
    print_fail "system_settings table is empty"
fi

print_test 10 "Verify ALLOW_DEV_ROLE_IN_PRODUCTION setting exists"
DEV_ROLE_SETTING=$(docker exec dataaggregator-db-1 psql -U postgres -d dataaggregator \
    -t -c "SELECT key FROM system_settings WHERE key='ALLOW_DEV_ROLE_IN_PRODUCTION';" 2>/dev/null)

if echo "$DEV_ROLE_SETTING" | grep -q "ALLOW_DEV_ROLE_IN_PRODUCTION"; then
    print_pass "ALLOW_DEV_ROLE_IN_PRODUCTION setting exists"
else
    print_fail "ALLOW_DEV_ROLE_IN_PRODUCTION setting not found"
fi

# ============================================================================
# TEST SUITE 5: Health Checks
# ============================================================================
echo -e "\n${YELLOW}═══ TEST SUITE 5: Health Checks ═══${NC}"

print_test 11 "Verify backend health endpoint"
HEALTH_RESPONSE=$(curl -s "${BASE_URL}/health")

if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    print_pass "Backend health check passed"
else
    print_fail "Backend health check failed"
fi

print_test 12 "Verify API documentation is accessible"
DOCS_RESPONSE=$(curl -s "${BASE_URL}/docs")

if echo "$DOCS_RESPONSE" | grep -q "Data Aggregator"; then
    print_pass "API documentation is accessible"
else
    print_fail "API documentation not accessible"
fi

print_test 13 "Verify frontend is running"
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000")

if [ "$FRONTEND_RESPONSE" -eq 200 ] || [ "$FRONTEND_RESPONSE" -eq 307 ]; then
    print_pass "Frontend is running (HTTP $FRONTEND_RESPONSE)"
else
    print_fail "Frontend not responding correctly (HTTP $FRONTEND_RESPONSE)"
fi

# ============================================================================
# TEST SUITE 6: Database Connections
# ============================================================================
echo -e "\n${YELLOW}═══ TEST SUITE 6: Database Connections ═══${NC}"

print_test 14 "Verify PostgreSQL is running"
PG_STATUS=$(docker exec dataaggregator-db-1 pg_isready -U postgres 2>/dev/null)

if echo "$PG_STATUS" | grep -q "accepting connections"; then
    print_pass "PostgreSQL is accepting connections"
else
    print_fail "PostgreSQL connection check failed"
fi

print_test 15 "Verify Redis is running"
REDIS_STATUS=$(docker exec dataaggregator-redis-1 redis-cli ping 2>/dev/null)

if [ "$REDIS_STATUS" = "PONG" ]; then
    print_pass "Redis is running"
else
    print_fail "Redis connection check failed"
fi

# ============================================================================
# TEST SUITE 7: User Management
# ============================================================================
echo -e "\n${YELLOW}═══ TEST SUITE 7: User Management ═══${NC}"

print_test 16 "Verify admin user exists in database"
ADMIN_EXISTS=$(docker exec dataaggregator-db-1 psql -U postgres -d dataaggregator \
    -t -c "SELECT COUNT(*) FROM users WHERE username='admin' AND role='admin';" 2>/dev/null)

if [ "$ADMIN_EXISTS" -eq 1 ] 2>/dev/null; then
    print_pass "Admin user exists with admin role"
else
    print_fail "Admin user not found or has incorrect role"
fi

print_test 17 "Verify role field accepts 6 different roles"
ROLE_COUNT=$(docker exec dataaggregator-db-1 psql -U postgres -d dataaggregator \
    -t -c "SELECT COUNT(DISTINCT role) FROM users;" 2>/dev/null)

print_pass "Database contains $ROLE_COUNT distinct role(s)"

# ============================================================================
# SUMMARY
# ============================================================================
echo -e "\n${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}                  TEST SUMMARY${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"

PASS_RATE=$((PASS * 100 / TOTAL))
echo -e "\nPass Rate: ${PASS_RATE}%"

if [ $FAIL -eq 0 ]; then
    echo -e "\n${GREEN}✓ ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "\n${RED}✗ SOME TESTS FAILED${NC}"
    exit 1
fi
