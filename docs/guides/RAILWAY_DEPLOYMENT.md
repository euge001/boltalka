# Railway Deployment Checklist

## ✅ Что уже готово
- [x] GitHub репозиторий (https://github.com/euge001/boltalka)
- [x] Docker конфиги (Dockerfile.backend, Dockerfile.frontend)
- [x] railway.json в root (для backend)
- [x] railway.json в packages/frontend (для frontend)

## 🔧 Что нужно сделать на Railway

### 1️⃣ Backend Service (Node.js + Fastify)
**На Railway → Settings каждого сервиса установить:**

```env
# Основные
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info

# База данных (будет автоматически от Railway PostgreSQL плагина)
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/boltalka
DB_HOST=[postgres-service-host]
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=[set-strong-password]
DB_NAME=boltalka

# Безопасность (СГЕНЕРИТЬ НОВЫЕ ЗНАЧЕНИЯ!)
JWT_SECRET=[generate-strong-secret-min-32-chars]

# API (обычно генерируется Railway автоматически)
CORS_ORIGIN=https://[frontend-railway-domain].railway.app

# OpenAI (получить на https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-...

# Optional
LANGFUSE_PUBLIC_KEY=[опционально]
LANGFUSE_SECRET_KEY=[опционально]
```

### 2️⃣ Frontend Service (Next.js)

**На Railway → Settings для frontend:**

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://[backend-railway-domain].railway.app
```

### 3️⃣ Database (PostgreSQL)
```
1. На Railway dashboard нажми "+ Create"
2. Выбери "PostgreSQL"
3. Attach к backend сервису
4. Railway автоматически установит DATABASE_URL
```

### 4️⃣ После деплоя
```bash
# Backend должен запуститься и выдать URL типа:
# ✓ boltalka-backend-prod.railway.app

# Frontend должен быть доступен по:
# ✓ boltalka-frontend-prod.railway.app

# Проверить здоровье backend:
curl https://boltalka-backend-prod.railway.app/health
```

## 🎯 Требования по переменным

| Переменная | Требование | Пример |
|-----------|-----------|--------|
| JWT_SECRET | 32+ символов, случайные | `openssl rand -base64 32` |
| OPENAI_API_KEY | Обязательно для работы | `sk-proj-...` |
| DATABASE_URL | Auto от PostgreSQL плагина | `postgresql://...` |
| CORS_ORIGIN | URL frontend'а | `https://frontend.railway.app` |

## ❓ Как сгенерировать JWT_SECRET

```bash
# Локально на машине
openssl rand -base64 32

# Или используй онлайн генератор
# https://generate-random.org/encryption-key-generator
```

## 🐛 Если что-то не работает

### Build fails с ошибкой про Dockerfile
- ✓ Проверь что Dockerfile.backend и Dockerfile.frontend есть в root репо

### Backend crashует  
```bash
# На Railway → Logs смотри что там
# Обычно это DATABASE_URL или OPENAI_API_KEY
```

### Frontend не грузится
- Проверь что NEXT_PUBLIC_API_URL указан на правильный backend URL
- Очистить браузер cache (Ctrl+Shift+Delete)

## 📝 Инструкция для добавления Frontend как второй сервис на Railway

1. Удали текущий frontend service с Railway
2. В Railway dashboard нажми "+ Create" 
3. Выбери "GitHub"
4. Выбери boltalka репо
5. В Service Root Directory: `packages/frontend`
6. Потом Railway спросит где railway.json - выбери `packages/frontend/railway.json`
7. Дождись деплоя и установи ENV переменные

---

Готово? Нажми **Redeploy** на backend сервисе и дай мне знать результат! 🚀
