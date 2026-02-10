# QUICK REFERENCE — TL;DR

## Starting the System
```bash
cd /var/www/html/Boltalka-Node
BACKEND_PORT=3002 FRONTEND_PORT=3005 bash start-all.sh
```

## URLs
- **Chat:** http://localhost:3005/chat
- **Coder:** http://localhost:3005/coder
- **Backend Health:** http://localhost:3002/health
- **Backend API:** http://localhost:3002/api/

## Project Structure
```
packages/
├── backend/          (Fastify on 3002)
│   ├── src/
│   │   ├── api/      (REST routes)
│   │   ├── core/     (LLM chains, Agents)
│   │   ├── config/   (Fastify, env, logger)
│   │   └── main.ts
│   └── .env          (PORT=3002)
└── frontend/         (Next.js on 3005)
    ├── app/
    │   ├── chat/     (Voice Bot)
    │   ├── coder/    (Code Expert)
    │   └── page.tsx  (redirect)
    └── .env.local    (NEXT_PUBLIC_API_URL=http://localhost:3002)
```

## Logs
```bash
tail -f /tmp/backend.log      # Backend
tail -f /tmp/frontend.log     # Frontend
```

## Key Endpoints
```
POST /api/agent/start          # Create conversation
POST /api/agent/chat           # Send message
GET  /api/agent/conversations  # List chats
POST /api/llm/code-expert      # Code generation
GET  /health                   # System health
```

## Config Files
- Backend env: `packages/backend/.env`
- Frontend env: `packages/frontend/.env.local`
- Startup script: `start-all.sh`

## Tests
```bash
cd packages/backend
npm test              # 199/199 passing ✅
```

## Database
- **Type:** PostgreSQL 16
- **Port:** 5432
- **ORM:** Prisma 5.7
- **Connection:** `packages/backend/.env` → `DATABASE_URL`

## Stack
| Component | Version | Port |
|-----------|---------|------|
| Node.js | 20.x | - |
| Fastify | 4.25 | 3002 |
| Next.js | 14.2 | 3005 |
| PostgreSQL | 16 | 5432 |
| LangChain | 0.1.17 | - |
| LangGraph | Latest | - |

## Development

### Backend
```bash
cd packages/backend
PORT=3002 node dist/main.js
```

### Frontend
```bash
cd packages/frontend
PORT=3005 npm run dev
```

## Status
✅ **All systems operational**
- Backend healthy (uptime tracking in health check)
- Frontend rendering correctly
- Database connected
- API endpoints responding
- 199/199 tests passing
- NO hardcoded ports
- NO authentication barriers
- NO broken imports

## Issues Fixed Today
- ✅ Port conflicts (3000/3001/3002 → stable 3002/3005)
- ✅ ES module errors (require → import in agent)
- ✅ UI visibility (dark theme applied)
- ✅ Authentication removed (Days 1-7 baseline)
- ✅ TypeScript ref types (HTMLDivElement → HTMLPreElement)

## Next Session
1. Run the startup command
2. Open http://localhost:3005/chat
3. Test chat functionality
4. Everything should work ✅

---
**Last update:** 9 Feb 2026 | **Status:** READY TO DEPLOY
