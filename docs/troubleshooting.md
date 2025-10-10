# Data Aggregator Platform - Troubleshooting Guide

**Comprehensive troubleshooting guide for common issues and their solutions**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Diagnostics](#quick-diagnostics)
- [Database Issues](#database-issues)
- [Backend API Issues](#backend-api-issues)
- [Frontend Issues](#frontend-issues)
- [Authentication Issues](#authentication-issues)
- [Pipeline Execution Issues](#pipeline-execution-issues)
- [Performance Issues](#performance-issues)
- [Deployment Issues](#deployment-issues)
- [Integration Issues](#integration-issues)
- [Security Issues](#security-issues)
- [Data Issues](#data-issues)
- [Getting Support](#getting-support)

---

## Overview

This guide covers common issues encountered in the Data Aggregator Platform across all deployment environments (Docker, AWS, Azure, GCP).

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| 🔴 **Critical** | Service down, data loss | Immediate |
| 🟠 **High** | Major functionality impaired | < 2 hours |
| 🟡 **Medium** | Minor functionality affected | < 1 day |
| 🟢 **Low** | Cosmetic, workarounds available | < 1 week |

---

## Quick Diagnostics

### Health Check Commands

```bash
# Check all services status (Docker)
docker-compose ps

# Check backend health
curl http://localhost:8001/health/live
curl http://localhost:8001/health/ready

# Check database connectivity
docker-compose exec postgres pg_isready

# Check Redis connectivity
docker-compose exec redis redis-cli ping

# View recent logs
docker-compose logs --tail=100 backend
docker-compose logs --tail=100 frontend
```

### Cloud Platform Health Checks

**AWS**:
```bash
# Check ECS service status
aws ecs describe-services --cluster dataaggregator --services backend frontend

# Check RDS status
aws rds describe-db-instances --db-instance-identifier dataaggregator-db

# Check ElastiCache status
aws elasticache describe-cache-clusters --cache-cluster-id dataaggregator-redis
```

**Azure**:
```bash
# Check Container App status
az containerapp show --name backend --resource-group rg-dataaggregator

# Check PostgreSQL status
az postgres flexible-server show --name dataaggregator-db --resource-group rg-dataaggregator

# Check Redis status
az redis show --name dataaggregator-redis --resource-group rg-dataaggregator
```

**GCP**:
```bash
# Check Cloud Run status
gcloud run services describe backend --region us-central1

# Check Cloud SQL status
gcloud sql instances describe dataaggregator-db

# Check Memorystore status
gcloud redis instances describe dataaggregator-redis --region us-central1
```

---

## Database Issues

### Issue 1: Connection Failed 🔴

**Symptoms**:
- Backend logs: `could not connect to server: Connection refused`
- Health check fails: `/health/ready` returns 503

**Possible Causes**:
1. Database service not running
2. Wrong connection credentials
3. Network/firewall blocking connection
4. SSL/TLS configuration mismatch

**Solutions**:

```bash
# 1. Verify database is running
docker-compose ps postgres  # Docker
aws rds describe-db-instances --db-instance-identifier <id>  # AWS
az postgres flexible-server show --name <name> --resource-group <rg>  # Azure
gcloud sql instances describe <instance>  # GCP

# 2. Test connection manually
# Docker:
docker-compose exec postgres psql -U postgres -d dataaggregator

# Cloud (with proper connection string):
psql "postgresql://user:password@host:5432/dataaggregator?sslmode=require"

# 3. Check environment variables
docker-compose exec backend env | grep POSTGRES

# 4. Verify firewall rules
# AWS: Check security group inbound rules (port 5432)
# Azure: Check NSG rules
# GCP: Check firewall rules and Cloud SQL authorized networks

# 5. Check SSL mode
# If required, ensure connection string includes: ?sslmode=require
```

**Prevention**:
- Use health checks in your deployment
- Monitor database connection pool metrics
- Set up alerts for connection failures

---

### Issue 2: Slow Query Performance 🟠

**Symptoms**:
- API responses slow (>2 seconds)
- Database CPU usage high (>80%)
- Timeout errors in logs

**Diagnosis**:

```sql
-- Find slow queries (PostgreSQL)
SELECT query, calls, total_exec_time, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Check missing indexes
SELECT schemaname, tablename, attname, n_distinct
FROM pg_stats
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n_distinct DESC;
```

**Solutions**:

```bash
# 1. Add missing indexes
docker-compose exec backend python scripts/add_indexes.py

# 2. Analyze query plans
docker-compose exec postgres psql -U postgres -d dataaggregator -c "
  EXPLAIN ANALYZE SELECT * FROM pipelines WHERE owner_id = 'user123';
"

# 3. Increase connection pool size
# Update .env:
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=10

# 4. Enable query result caching
# backend/core/database.py
# Add Redis caching for frequent queries

# 5. Scale database (cloud platforms)
# AWS: Upgrade instance class
aws rds modify-db-instance --db-instance-identifier <id> \
  --db-instance-class db.t3.large --apply-immediately

# Azure: Scale up
az postgres flexible-server update --name <name> \
  --resource-group <rg> --sku-name Standard_D4s_v3

# GCP: Scale up
gcloud sql instances patch <instance> --tier=db-n1-standard-2
```

---

### Issue 3: Migration Failed 🟠

**Symptoms**:
- `alembic upgrade head` fails with SQL errors
- Database schema out of sync

**Solutions**:

```bash
# 1. Check current migration version
alembic current

# 2. View migration history
alembic history

# 3. If stuck, mark as current version (use cautiously)
alembic stamp head

# 4. Rollback one version
alembic downgrade -1

# 5. Re-run migrations
alembic upgrade head

# 6. Manual fix (if schema corruption)
# Backup first!
docker-compose exec postgres pg_dump -U postgres dataaggregator > backup.sql

# Drop and recreate
docker-compose exec postgres psql -U postgres -c "DROP DATABASE dataaggregator;"
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE dataaggregator;"

# Run migrations
docker-compose exec backend alembic upgrade head

# 7. Restore data (if needed)
docker-compose exec -T postgres psql -U postgres dataaggregator < backup.sql
```

---

## Backend API Issues

### Issue 1: API Returns 500 Internal Server Error 🔴

**Symptoms**:
- Frontend shows "Server Error"
- Backend logs show stack traces

**Diagnosis**:

```bash
# Check backend logs
docker-compose logs backend --tail=50

# Check for exceptions
docker-compose logs backend | grep -i "error\|exception\|traceback"

# Check Sentry (if configured)
# View error dashboard for detailed stack traces
```

**Common Causes & Solutions**:

**1. Unhandled Exception**:
```python
# Add proper error handling
try:
    result = some_operation()
except SpecificException as e:
    logger.error(f"Operation failed: {e}")
    raise HTTPException(status_code=500, detail="Operation failed")
```

**2. Missing Environment Variable**:
```bash
# Check required env vars
docker-compose exec backend python -c "
import os
print('SECRET_KEY:', os.getenv('SECRET_KEY', 'NOT SET'))
print('DATABASE_URL:', os.getenv('DATABASE_URL', 'NOT SET'))
"
```

**3. Dependency Issue**:
```bash
# Reinstall dependencies
docker-compose exec backend poetry install

# Or rebuild container
docker-compose up -d --build backend
```

---

### Issue 2: High Memory Usage 🟠

**Symptoms**:
- Backend container using >2GB memory
- Out of memory errors
- Service restarts frequently

**Diagnosis**:

```bash
# Check memory usage
docker stats backend

# Check for memory leaks (Python)
docker-compose exec backend python -c "
import psutil
import os
process = psutil.Process(os.getpid())
print(f'Memory: {process.memory_info().rss / 1024 / 1024:.2f} MB')
"
```

**Solutions**:

```bash
# 1. Increase memory limit (Docker)
# docker-compose.yml:
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G

# 2. Fix memory leaks
# - Close database connections properly
# - Clear large objects after use
# - Use generators for large datasets

# 3. Optimize queries (pagination)
# Instead of: SELECT * FROM pipelines
# Use: SELECT * FROM pipelines LIMIT 100 OFFSET 0

# 4. Enable connection pooling
# backend/core/database.py
engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=0,
    pool_pre_ping=True
)

# 5. Scale resources (cloud)
# AWS ECS: Update task definition memory
# Azure: Scale Container App
# GCP: Increase Cloud Run memory allocation
```

---

### Issue 3: Rate Limiting Errors 🟡

**Symptoms**:
- API returns 429 Too Many Requests
- Users unable to make requests

**Diagnosis**:

```bash
# Check rate limit configuration
docker-compose exec backend python -c "
from backend.middleware.rate_limiting import get_rate_limits
print(get_rate_limits())
"

# Check Redis for rate limit keys
docker-compose exec redis redis-cli --scan --pattern "rate_limit:*"
```

**Solutions**:

```bash
# 1. Increase rate limits (for legitimate traffic spikes)
# backend/middleware/rate_limiting.py
RATE_LIMITS = {
    "api": {"max_requests": 200, "window_seconds": 60},  # Increased from 100
    "login": {"max_requests": 10, "window_seconds": 60}
}

# 2. Whitelist specific IPs
# backend/middleware/rate_limiting.py
WHITELIST_IPS = ["10.0.0.0/8", "192.168.0.0/16"]

# 3. Clear rate limit for specific user (temporary)
docker-compose exec redis redis-cli DEL "rate_limit:user:user_id_here"

# 4. Implement token bucket algorithm (more flexible)
# See: backend/middleware/rate_limiting.py
```

---

## Frontend Issues

### Issue 1: Blank Page / White Screen 🔴

**Symptoms**:
- Browser shows blank white page
- No console errors (or JS errors)

**Diagnosis**:

```bash
# Check frontend logs
docker-compose logs frontend --tail=50

# Check browser console
# Open browser DevTools (F12) → Console tab

# Check frontend build
docker-compose exec frontend npm run build
```

**Solutions**:

```bash
# 1. Clear browser cache
# Chrome: Ctrl+Shift+Del → Clear cache

# 2. Check API connection
# Browser console:
fetch('http://localhost:8001/health/live')
  .then(r => r.json())
  .then(console.log)

# 3. Verify environment variables
docker-compose exec frontend env | grep NEXT_PUBLIC

# 4. Rebuild frontend
docker-compose up -d --build frontend

# 5. Check for JS errors in build
docker-compose exec frontend npm run lint

# 6. Test in development mode
cd frontend
npm run dev
# Open http://localhost:3000
```

---

### Issue 2: API Calls Failing (CORS Error) 🟠

**Symptoms**:
- Browser console: `Access to fetch blocked by CORS policy`
- Network tab shows preflight OPTIONS requests failing

**Diagnosis**:

```bash
# Check CORS headers in response
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS \
  http://localhost:8001/api/pipelines -v

# Expected headers:
# Access-Control-Allow-Origin: http://localhost:3000
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE
```

**Solutions**:

```bash
# 1. Update CORS settings
# backend/core/config.py
CORS_ORIGINS = [
    "http://localhost:3000",
    "https://yourdomain.com"
]

# 2. Verify frontend API URL
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8001

# 3. Restart backend after config change
docker-compose restart backend

# 4. For production (cloud load balancers)
# Ensure load balancer forwards Origin header to backend
# AWS ALB: Enable CORS in target group
# Azure App Gateway: Configure rewrite rules
# GCP Load Balancer: Use backend service settings
```

---

### Issue 3: Slow Page Load 🟡

**Symptoms**:
- Pages take >5 seconds to load
- Large bundle sizes
- Poor Lighthouse scores

**Diagnosis**:

```bash
# Check bundle size
cd frontend
npm run build
# Check .next/static/ folder size

# Analyze bundle
npm run analyze  # If configured

# Check Lighthouse score
# Chrome DevTools → Lighthouse → Generate report
```

**Solutions**:

```bash
# 1. Enable code splitting
# next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,
  },
}

# 2. Lazy load heavy components
# Use dynamic imports:
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <Skeleton />,
  ssr: false
})

# 3. Optimize images
npm install @next/image
# Use Next.js Image component

# 4. Enable compression (production)
# Backend: Enable gzip/brotli
# Cloud: Use CDN (CloudFront, Azure CDN, Cloud CDN)

# 5. Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  // Rendering logic
})
```

---

## Authentication Issues

### Issue 1: Cannot Login (401 Unauthorized) 🔴

**Symptoms**:
- Login form shows "Invalid credentials"
- Correct password doesn't work

**Diagnosis**:

```bash
# Check user exists
docker-compose exec postgres psql -U postgres -d dataaggregator -c "
  SELECT email, role, is_active FROM users WHERE email = 'user@example.com';
"

# Test authentication directly
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' -v
```

**Solutions**:

```bash
# 1. Verify user is active
docker-compose exec postgres psql -U postgres -d dataaggregator -c "
  UPDATE users SET is_active = true WHERE email = 'user@example.com';
"

# 2. Reset password
docker-compose exec backend python scripts/reset_password.py user@example.com

# 3. Check password hashing
# Ensure bcrypt is working:
docker-compose exec backend python -c "
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
hashed = pwd_context.hash('password123')
print('Hash:', hashed)
print('Verify:', pwd_context.verify('password123', hashed))
"

# 4. Check JWT secret key
# Ensure SECRET_KEY is set and consistent
docker-compose exec backend env | grep SECRET_KEY

# 5. Clear any cached tokens (frontend)
# Browser: localStorage.clear() in console
```

---

### Issue 2: Token Expired Constantly 🟡

**Symptoms**:
- User logged out every few minutes
- "Token expired" errors

**Diagnosis**:

```bash
# Check token expiry settings
docker-compose exec backend python -c "
import os
print('Access token TTL:', os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', 30))
print('Refresh token TTL:', os.getenv('REFRESH_TOKEN_EXPIRE_DAYS', 7))
"

# Decode token to check expiry
# Use jwt.io or:
docker-compose exec backend python -c "
import jwt
token = '<your-token>'
decoded = jwt.decode(token, options={'verify_signature': False})
print('Expires:', decoded.get('exp'))
"
```

**Solutions**:

```bash
# 1. Increase token lifetime
# .env
ACCESS_TOKEN_EXPIRE_MINUTES=60  # Increased from 30
REFRESH_TOKEN_EXPIRE_DAYS=30    # Increased from 7

# 2. Implement refresh token logic (frontend)
# src/lib/api.ts
async function refreshToken() {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: getRefreshToken() })
  })
  // Update access token
}

# 3. Check server time sync
# Ensure backend and frontend servers have correct time
date  # Should match actual time

# 4. Use sliding expiration
# Update token on each request (backend)
```

---

## Pipeline Execution Issues

### Issue 1: Pipeline Execution Fails 🔴

**Symptoms**:
- Pipeline status: "failed"
- Error in execution logs

**Diagnosis**:

```bash
# Check pipeline execution logs
docker-compose exec backend python -c "
from backend.crud import pipeline_runs
# Query recent failed runs
"

# View execution history
curl http://localhost:8001/api/pipelines/{pipeline_id}/runs
```

**Solutions**:

```bash
# 1. Check connector configuration
# Ensure source/destination connectors are valid

# 2. Test connector connection
curl -X POST http://localhost:8001/api/connectors/{connector_id}/test

# 3. Validate transformation code
# Check for syntax errors in transformation

# 4. Check error logs
docker-compose exec backend python -c "
from backend.services.pipeline_executor import execute_pipeline
# Debug execution
"

# 5. Increase timeout
# backend/services/pipeline_executor.py
EXECUTION_TIMEOUT = 600  # 10 minutes
```

---

### Issue 2: Transformation Data Loss 🔴

**Symptoms**:
- Pipeline completes but data missing
- Record count mismatch

**Diagnosis**:

```bash
# Check transformation logs
# View intermediate data at each step

# Validate source data count
# Compare with destination data count
```

**Solutions**:

```bash
# 1. Enable debug logging
# backend/services/transformation_service.py
logger.setLevel(logging.DEBUG)

# 2. Test transformation with sample data
curl -X POST http://localhost:8001/api/transformations/{id}/test \
  -H "Content-Type: application/json" \
  -d '{"sample_data": [...]}'

# 3. Check for filter conditions
# Ensure transformations aren't filtering out data unintentionally

# 4. Validate data types
# Type mismatches can cause data loss

# 5. Add data validation checkpoints
# Log record counts at each stage
```

---

## Performance Issues

### Issue 1: High CPU Usage 🟠

**Symptoms**:
- CPU usage >80%
- Service slow or unresponsive

**Diagnosis**:

```bash
# Check CPU usage
docker stats

# Profile Python code
docker-compose exec backend python -m cProfile -o profile.out your_script.py
docker-compose exec backend python -c "
import pstats
stats = pstats.Stats('profile.out')
stats.sort_stats('cumulative').print_stats(20)
"
```

**Solutions**:

```bash
# 1. Optimize database queries (see Database Issues)

# 2. Use async operations
# Replace synchronous calls with async/await

# 3. Add caching
# Cache expensive operations in Redis

# 4. Scale horizontally
# Add more container instances (cloud)

# 5. Profile and optimize hot paths
# Use py-spy or cProfile to find bottlenecks
```

---

## Deployment Issues

### Issue 1: Container Won't Start 🔴

**Symptoms**:
- Container exits immediately
- Health checks failing

**Diagnosis**:

```bash
# Check container logs
docker-compose logs backend

# Check exit code
docker-compose ps backend

# Try running interactively
docker-compose run backend bash
```

**Solutions**:

```bash
# 1. Check command and entrypoint
# Ensure CMD in Dockerfile is correct

# 2. Verify dependencies installed
docker-compose exec backend poetry show

# 3. Check environment variables
docker-compose exec backend env

# 4. Port conflicts
# Ensure port 8001 is available
lsof -i :8001
# Kill conflicting process if needed

# 5. Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

---

## Getting Support

### Self-Service Resources

1. **Documentation**: Check `docs/` directory
2. **Logs**: Review application logs for errors
3. **Health Checks**: Run diagnostics commands
4. **Community**: Search GitHub Issues

### Reporting Issues

When reporting issues, include:

1. **Environment**: Docker/AWS/Azure/GCP, OS, versions
2. **Steps to Reproduce**: Detailed steps
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Logs**: Relevant error logs
6. **Screenshots**: If UI-related

### Contact

- **GitHub Issues**: https://github.com/yourusername/dataaggregator/issues
- **Email**: support@dataaggregator.com
- **Community**: Discord/Slack (if available)
- **Emergency**: security@dataaggregator.com (security issues only)

---

## Appendix: Useful Commands

### Docker Commands

```bash
# Restart all services
docker-compose restart

# Rebuild specific service
docker-compose up -d --build backend

# View logs (follow)
docker-compose logs -f

# Execute command in container
docker-compose exec backend bash

# Remove all containers and volumes
docker-compose down -v

# Check disk usage
docker system df
```

### Database Commands

```bash
# Backup database
docker-compose exec postgres pg_dump -U postgres dataaggregator > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres dataaggregator < backup.sql

# Connect to database
docker-compose exec postgres psql -U postgres -d dataaggregator

# Vacuum database
docker-compose exec postgres psql -U postgres -d dataaggregator -c "VACUUM ANALYZE;"
```

### Debugging Commands

```bash
# Check port usage
lsof -i :8001
netstat -tuln | grep 8001

# Test network connectivity
curl http://localhost:8001/health/live
telnet localhost 8001

# Check disk space
df -h

# Check memory
free -h

# Monitor processes
htop  # or top
```

---

**Document Version**: 1.0
**Last Updated**: October 9, 2025
**Next Review**: Monthly or after major incidents

**See Also**:
- [Deployment Guide](./deployment-guide.md)
- [Production Runbook](./runbook.md)
- [Security Documentation](./security.md)
