# ⚡ Action Plan: Phase 1 (Week 1-2)

## 🎯 Phase 1 Goal
Ready infrastructure for development: monorepo, Docker, TypeScript, basic scaffolds backend + frontend.

**Result:** `turbo run build` works, both applications launch locally in Docker.

---

## 📅 Day 1: Monorepo Setup

### Step 1.1 - Initialize structure
```bash
cd /var/www/html/Boltalka-Node
rm app.js coder.js *.php index.html coder.html manifest.webmanifest || true

# Create monorepo structure
mkdir -p packages/backend packages/frontend packages/shared
mkdir -p infra/docker infra/scripts docs
```

### Step 1.2 - Initialize root package.json
```bash
cat > package.json << 'EOF'
{
  "name": "boltalka-ai-native",
  "version": "2.0.0",
  "description": "AI-native voice interaction platform",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md,css}\"",
    "clean": "turbo clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^1.10.16",
    "prettier": "^3.1.1",
    "typescript": "^5.3.3"
  },
  "packageManager": "pnpm@8.15.4"
}
EOF
```

### Step 1.3 - pnpm workspace config
```bash
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'packages/**'
EOF
```

### Step 1.4 - TypeScript base config (root)
```bash
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
EOF
```

### Step 1.5 - Prettier config
```bash
cat > .prettierrc.json << 'EOF'
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2
}
EOF

cat > .prettierignore << 'EOF'
node_modules
dist
build
coverage
pnpm-lock.yaml
EOF
```

### Step 1.6 - Git & env
```bash
cat > .gitignore << 'EOF'
node_modules
dist
build
.next
coverage
.env
.env.local
*.log
.DS_Store
EOF

cat > .env.example << 'EOF'
# Backend
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/boltalka
REDIS_URL=redis://localhost:6379
NODE_ENV=development

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000
EOF

cp .env.example .env
```

✅ **Day 1 Result:** Basic structure ready.

---

## 📅 Day 2: Backend Scaffold

### Step 2.1 - Backend package.json
```bash
cat > packages/backend/package.json << 'EOF'
{
  "name": "@boltalka/backend",
  "version": "2.0.0",
  "type": "module",
  "main": "dist/main.js",
  "scripts": {
    "dev": "ts-node --esm src/main.ts",
    "build": "tsc",
    "start": "node dist/main.js",
    "test": "jest",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write src"
  },
  "dependencies": {
    "fastify": "^4.25.1",
    "@fastify/cors": "^8.4.2",
    "@fastify/jwt": "^7.8.0",
    "@fastify/websocket": "^10.0.1",
    "pino": "^8.17.2",
    "dotenv": "^16.3.1",
    "@apollo/server": "^4.10.1",
    "graphql": "^16.8.1",
    "langchain": "^0.1.26",
    "@langchain/openai": "^0.0.24",
    "@langchain/community": "^0.0.29",
    "@prisma/client": "^5.7.1",
    "zod": "^3.18.2",
    "jsonwebtoken": "^9.1.2",
    "bcryptjs": "^2.4.3"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.6",
    "@typescript-eslint/eslint-plugin": "^6.17.0",
    "@typescript-eslint/parser": "^6.17.0",
    "eslint": "^8.56.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "@types/jest": "^29.5.11",
    "ts-node": "^10.9.2",
    "prisma": "^5.7.1"
  }
}
EOF
```

### Step 2.2 - Backend TypeScript config
```bash
cat > packages/backend/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020"],
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "declaration": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "tests"]
}
EOF
```

### Step 2.3 - Backend directory structure
```bash
mkdir -p packages/backend/src/{core,api,services,utils,config,types,constants}
mkdir -p packages/backend/src/core/{llm,voice,database,observability,auth}
mkdir -p packages/backend/src/api/{rest,graphql,websocket}
mkdir -p packages/backend/tests/{unit,integration}
```

### Step 2.4 - Backend main entry point
```bash
cat > packages/backend/src/main.ts << 'EOF'
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { logger } from './utils/logger';

const PORT = parseInt(process.env.PORT || '3000');
const HOST = process.env.HOST || 'localhost';

async function start() {
  const fastify = Fastify({ logger: true });

  // Plugins
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || '*',
  });
  
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'dev-secret',
  });

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // API Routes (TODO)
  fastify.get('/api/hello', async () => {
    return { message: 'Backend working!' };
  });

  try {
    await fastify.listen({ port: PORT, host: HOST });
    logger.info(`✅ Server running on http://${HOST}:${PORT}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

start();
EOF
```

### Step 2.5 - Logger utility
```bash
cat > packages/backend/src/utils/logger.ts << 'EOF'
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      singleLine: false,
    },
  },
});
EOF
```

### Step 2.6 - Prisma schema (base)
```bash
mkdir -p packages/backend/prisma

cat > packages/backend/prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  conversations Conversation[]
}

model Conversation {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  mode      String   @default("voice") // voice | code_expert
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  messages Message[]
}

model Message {
  id              String   @id @default(cuid())
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  role            String   // user | assistant
  content         String   @db.Text
  tokensUsed      Int      @default(0)
  createdAt       DateTime @default(now())
}
EOF
```

### Step 2.7 - Backend env file
```bash
cat > packages/backend/.env.example << 'EOF'
# Core
NODE_ENV=development
PORT=3000
HOST=localhost
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/boltalka

# OpenAI
OPENAI_API_KEY=sk-...

# JWT
JWT_SECRET=dev-secret-change-in-prod

# CORS
CORS_ORIGIN=http://localhost:3001
EOF

cp packages/backend/.env.example packages/backend/.env
```

✅ **Day 2 Result:** Backend scaffold ready to launch.

---

## 📅 Day 3: Frontend Scaffold

### Step 3.1 - Frontend initialization (Next.js 14)
```bash
cd packages/frontend
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias '@/*'
```

### Step 3.2 - Frontend package.json (update)
```bash
cat > packages/frontend/package.json << 'EOF'
{
  "name": "@boltalka/frontend",
  "version": "2.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "next lint",
    "test": "vitest",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.7",
    "graphql-request": "^6.0.0",
    "axios": "^1.6.5",
    "clsx": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.6",
    "@types/react": "^18.2.46",
    "@types/react-dom": "^18.2.18",
    "@typescript-eslint/eslint-plugin": "^6.17.0",
    "@typescript-eslint/parser": "^6.17.0",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.1.0",
    "tailwindcss": "^3.4.1",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16",
    "vitest": "^1.1.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5"
  }
}
EOF
```

### Step 3.3 - Frontend structure
```bash
mkdir -p app/{boltalka,coder,settings,_layout}
mkdir -p components/{voice,chat,settings}
mkdir -p hooks
mkdir -p store
mkdir -p services
mkdir -p types
mkdir -p utils
```

### Step 3.4 - Frontend main layout
```bash
cat > app/layout.tsx << 'EOF'
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Boltalka - AI Voice Assistant',
  description: 'Real-time voice interaction with AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
EOF
```

### Step 3.5 - Frontend home page
```bash
cat > app/page.tsx << 'EOF'
'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8">
      <h1 className="text-4xl font-bold">Boltalka AI</h1>
      
      <div className="grid grid-cols-2 gap-4">
        <Link 
          href="/boltalka"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          🎤 Voice Chat
        </Link>
        
        <Link 
          href="/coder"
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          💻 Code Expert
        </Link>
      </div>
    </div>
  );
}
EOF
```

### Step 3.6 - Frontend env file
```bash
cat > packages/frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3000
EOF
```

✅ **Day 3 Result:** Frontend scaffold ready.

---

## 📅 Day 4: Docker Setup

### Step 4.1 - Docker Compose
```bash
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: boltalka-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: boltalka
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: boltalka-redis
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: infra/docker/Dockerfile.backend
    container_name: boltalka-backend
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      PORT: 3000
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/boltalka
      REDIS_URL: redis://redis:6379
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./packages/backend/src:/app/src
    command: npm run dev

  frontend:
    build:
      context: .
      dockerfile: infra/docker/Dockerfile.frontend
    container_name: boltalka-frontend
    ports:
      - "3001:3001"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3000
    depends_on:
      - backend
    volumes:
      - ./packages/frontend:/app
      - /app/node_modules
    command: npm run dev

volumes:
  postgres_data:

networks:
  default:
    name: boltalka-network
EOF
```

### Step 4.2 - Backend Dockerfile
```bash
cat > infra/docker/Dockerfile.backend << 'EOF'
FROM node:20-alpine

WORKDIR /app

# Copy root files
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY tsconfig.json ./

# Copy backend
COPY packages/backend ./packages/backend

# Install
RUN corepack enable && pnpm install --frozen-lockfile

# Prisma setup
WORKDIR /app/packages/backend
RUN npx prisma generate

WORKDIR /app

EXPOSE 3000
CMD ["npm", "run", "dev"]
EOF
```

### Step 4.3 - Frontend Dockerfile
```bash
cat > infra/docker/Dockerfile.frontend << 'EOF'
FROM node:20-alpine

WORKDIR /app

# Copy root files
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# Copy frontend
COPY packages/frontend ./packages/frontend

# Install
RUN corepack enable && pnpm install --frozen-lockfile

WORKDIR /app/packages/frontend

EXPOSE 3001
CMD ["npm", "run", "dev"]
EOF
```

✅ **Day 4 Result:** Docker integration ready.

---

## 📅 Day 5: Turbo + CI/CD Setup

### Step 5.1 - Turbo config
```bash
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "cache": false
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    }
  }
}
EOF
```

### Step 5.2 - GitHub Actions CI/CD
```bash
mkdir -p .github/workflows

cat > .github/workflows/ci.yml << 'EOF'
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8.15.4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test
EOF
```

### Step 5.3 - Shared package (base)
```bash
cat > packages/shared/package.json << 'EOF'
{
  "name": "@boltalka/shared",
  "version": "2.0.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
EOF

mkdir -p packages/shared/src
cat > packages/shared/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true
  },
  "include": ["src"]
}
EOF

cat > packages/shared/src/index.ts << 'EOF'
// Types & constants shared between backend and frontend
export const API_VERSION = '2.0.0';
EOF
```

✅ **Day 5 Result:** Turbo + CI/CD pipeline ready.

---

## 📅 Day 6-7: Testing and Documentation

### Step 6.1 - Backend Jest config
```bash
cat > packages/backend/jest.config.js << 'EOF'
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  coverageThreshold: {
    global: { lines: 50 }
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
EOF
```

### Step 6.2 - Frontend Vitest config
```bash
cat > packages/frontend/vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      lines: 50
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
EOF
```

### Step 6.3 - README
```bash
cat > README.md << 'EOF'
# Boltalka AI - AI-native Voice Assistant

✨ Modern, scalable, production-ready voice interaction platform.

## Tech Stack

- **Frontend:** React 18, Next.js 14, TypeScript, Tailwind CSS
- **Backend:** Node.js, Fastify, TypeScript
- **LLM:** LangChain, OpenAI API
- **Database:** PostgreSQL, Redis, Pinecone (coming)
- **DevOps:** Docker, Turbo, GitHub Actions

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- pnpm

### Local Development
\`\`\`bash
# Install dependencies
pnpm install

# Start all services
docker-compose up

# Or run locally
pnpm dev
\`\`\`

### Access
- Frontend: http://localhost:3001
- Backend: http://localhost:3000
- API Health: http://localhost:3000/health

## Project Structure
\`\`\`
boltalka-ai-native/
├── packages/
│   ├── backend/       # Node.js + Fastify API
│   ├── frontend/      # React + Next.js UI
│   └── shared/        # Shared types & utilities
├── infra/            # Docker, scripts
├── docs/             # Documentation
└── .github/          # CI/CD workflows
\`\`\`

## Development

\`\`\`bash
# Build all packages
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format
\`\`\`

## Deployment

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for production deployment guide.

## License
MIT
EOF
```

✅ **Day 6-7 Result:** Phase 1 complete! ✅

---

## ✅ Final Verification (Day 7 Checklist)

```bash
# 1. Check structure
tree -L 2 -I node_modules

# 2. Start Docker
docker-compose up

# 3. Check endpoints
curl http://localhost:3000/health
curl http://localhost:3001

# 4. Check Turbo build
pnpm build

# 5. Check tests
pnpm test

# 6. Check linting
pnpm lint

# 7. Check formatting
pnpm format
```

### Expected Output ✅
```
✅ Backend running on http://localhost:3000
✅ Frontend running on http://localhost:3001
✅ Database connected
✅ Turbo build successful
✅ All tests passed
✅ No lint errors
```

---

## 🚀 What's Next?

After completing Phase 1, proceed to **Phase 2: LLM Layer**

- [ ] LangChain chains setup
- [ ] Langfuse integration
- [ ] Vector DB (Pinecone) setup
- [ ] RAG pipeline

**Status:** Ready to start!

---

## 📞 Troubleshooting

### Docker issues
```bash
# Clean everything
docker-compose down -v
docker system prune -a

# Rebuild
docker-compose up --build
```

### Database issues
```bash
# Reset database
docker exec boltalka-postgres dropdb boltalka
docker exec boltalka-postgres createdb boltalka

# Run migrations
docker exec boltalka-backend npx prisma migrate dev
```

### Port conflicts
```bash
# Change ports in docker-compose.yml
# backend: 3000 → 3010
# frontend: 3001 → 3011
```

---

**Timeline:** 7 days for full infrastructure readiness 🎯

**Next step:** Start with day 1! ⚡

Done! This is a **step-by-step action plan** with commands that can be copied and executed directly:

## 📊 Plan Structure:

✅ **Day 1** - Monorepo base (30 min)  
✅ **Day 2** - Backend scaffold (1-2 hours)  
✅ **Day 3** - Frontend scaffold (1 hour)  
✅ **Day 4** - Docker setup (45 min)  
✅ **Day 5** - Turbo + CI/CD (30 min)  
✅ **Day 6-7** - Testing + documentation (1 hour)  

**Total: 5-7 days** until fully working infrastructure.

Each day - concrete bash commands that can be copied directly to the terminal. After day 7, `docker-compose up` should launch both applications and all infrastructure ✅

Let's go? 🚀