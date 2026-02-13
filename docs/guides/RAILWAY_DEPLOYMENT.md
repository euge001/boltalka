# Railway Deployment Guide

## ✅ Prerequisites Ready
- [x] GitHub repository (https://github.com/euge001/boltalka)
- [x] Docker configs (Dockerfile.backend, Dockerfile.frontend)
- [x] railway.json in root (for backend)
- [x] Monorepo structure with pnpm

## 🔧 Setup on Railway

### 1️⃣ Backend Service (Node.js + Fastify)
**Set these environment variables in Railway → Service Settings:**

```env
# Core
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info

# Database (auto-populated from Railway PostgreSQL)
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/boltalka
DB_HOST=[postgres-service-host]
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=[set-strong-password]
DB_NAME=boltalka

# Security (GENERATE NEW VALUES!)
JWT_SECRET=[generate-strong-secret-min-32-chars]

# API Configuration
CORS_ORIGIN=https://[frontend-railway-domain].railway.app

# OpenAI API (get from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-...

# Optional
LANGFUSE_PUBLIC_KEY=[optional]
LANGFUSE_SECRET_KEY=[optional]
```

### 2️⃣ Frontend Service (Next.js)

**Set these environment variables in Railway → Service Settings:**

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://[backend-railway-domain].railway.app
```

### 3️⃣ Database (PostgreSQL)
```
1. In Railway dashboard, click "+ Create"
2. Select "PostgreSQL"
3. Attach to backend service
4. Railway will automatically set DATABASE_URL
```

### 4️⃣ After Deployment
```bash
# Backend should be accessible at:
# ✓ boltalka-backend-prod.railway.app

# Frontend should be accessible at:
# ✓ boltalka-frontend-prod.railway.app

# Health check:
curl https://boltalka-backend-prod.railway.app/health
```

## 📋 Environment Variables Reference

| Variable | Requirement | Example |
|----------|------------|---------|
| JWT_SECRET | 32+ random chars | `openssl rand -base64 32` |
| OPENAI_API_KEY | Required for AI features | `sk-proj-...` |
| DATABASE_URL | Auto from PostgreSQL plugin | `postgresql://...` |
| CORS_ORIGIN | Frontend domain | `https://frontend.railway.app` |

## 🔐 Generate JWT_SECRET

```bash
# Run locally
openssl rand -base64 32

# Or use online generator
# https://generate-random.org/encryption-key-generator
```

## 🐛 Troubleshooting

### Build fails with Dockerfile error
- ✓ Verify Dockerfile.backend and Dockerfile.frontend exist in root directory

### Backend crashes
```bash
# Check Railway → Logs
# Usually caused by DATABASE_URL or OPENAI_API_KEY issues
```

### Frontend not loading
- Verify NEXT_PUBLIC_API_URL points to correct backend URL
- Clear browser cache (Ctrl+Shift+Delete)

## 📝 Adding Frontend as Second Service

1. Go to Railway dashboard
2. Click "+ Create" 
3. Select "GitHub"
4. Choose boltalka repository
5. Set Service Root Directory: `packages/frontend`
6. Railway will use Dockerfile.frontend
7. Set environment variables

---

Ready? Click **Redeploy** on backend service and let me know the result! 🚀
