# 🚀 Quick Start - Local Deployment
**Get Data Aggregator Platform running in 5 minutes!**

---

## ⚡ Super Quick Start

```bash
# 1. Clone
git clone https://github.com/your-org/dataaggregator.git
cd dataaggregator

# 2. Configure
cp .env.example .env

# 3. Start
docker compose up -d

# 4. Access
# Frontend: http://localhost:3000
# Backend: http://localhost:8001/docs
# Login: admin / admin123!
```

**Done! Platform is running.** 🎉

---

## 📋 Prerequisites

**You need:**
- Docker & Docker Compose
- 8GB RAM (16GB recommended)
- 50GB free disk space

**Check if installed:**
```bash
docker --version
docker compose version
```

---

## 🔧 Configuration (Optional)

Edit `.env` file to customize:

```bash
# Security (CHANGE THESE!)
SECRET_KEY=your-super-secret-key-here
FIRST_SUPERUSER_PASSWORD=admin123!

# Database
POSTGRES_PASSWORD=postgres

# Ports (if conflicts)
# Default: Frontend=3000, Backend=8001
```

---

## 🎯 Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | admin / admin123! |
| **API Docs** | http://localhost:8001/docs | - |
| **API** | http://localhost:8001 | - |

---

## ✅ Verify Installation

```bash
# Check all services are running
docker compose ps

# Should show all as "Up (healthy)"

# Test backend
curl http://localhost:8001/health/live

# Expected: {"status":"healthy"}
```

---

## 🛠️ Common Commands

```bash
# View logs
docker compose logs -f

# Stop services (keep data)
docker compose stop

# Start services
docker compose start

# Restart everything
docker compose restart

# Stop and remove (keeps data)
docker compose down

# Remove everything including data
docker compose down -v
```

---

## 📊 Resource Usage

**Expected consumption:**
- CPU: 15-30%
- RAM: ~1.5GB
- Disk: 2-15GB

---

## 🔍 Troubleshooting

**Services won't start?**
```bash
# Check what's wrong
docker compose logs

# Common fix
docker compose down -v
docker compose up -d
```

**Port already in use?**
```bash
# Change ports in .env
FRONTEND_PORT=3001
BACKEND_PORT=8002
```

**Out of disk space?**
```bash
# Clean up Docker
docker system prune -a
```

---

## 🎓 Next Steps

1. **Login:** http://localhost:3000 with admin/admin123!
2. **Change password:** Settings → Security
3. **Create pipeline:** Pipelines → New Pipeline
4. **Add connector:** Connectors → New Connector
5. **Run pipeline:** Select pipeline → Execute

---

## 📖 Full Documentation

- **Complete Guide:** `DEPLOYMENT_GUIDE_COMPLETE.md`
- **API Docs:** http://localhost:8001/docs
- **User Guide:** `docs/user-guide.md`

---

## ⚠️ Important Notes

**Local deployment is for:**
- ✅ Development and testing
- ✅ Learning the platform
- ✅ Experiments and demos
- ✅ Small personal use (< 10 users)

**NOT for:**
- ❌ Production use
- ❌ Internet exposure
- ❌ Large-scale processing
- ❌ Critical data

**For production, see:** `DEPLOYMENT_GUIDE_COMPLETE.md`

---

## 🆘 Need Help?

**Check status:**
```bash
docker compose ps
docker compose logs
```

**Reset everything:**
```bash
docker compose down -v
rm -rf uploads/* logs/*
docker compose up -d
```

**Still stuck?**
- Read `DEPLOYMENT_GUIDE_COMPLETE.md`
- Check `docs/troubleshooting.md`
- Open GitHub issue

---

**Quick Start Guide**
**Version:** 1.0
**Last Updated:** October 23, 2025

🎉 **Happy data aggregating!**
