# 🔄 План рефакторинга Boltalka под AI-native Tech Lead стек

## 📋 Текущее состояние проекта

**Boltalka Voice Bot v9.0.0**
- **Frontend**: HTML5 (ванильный JS) + Bootstrap 5 + WebRTC
- **Backend**: PHP (Litespeed/Apache/Nginx)
- **API**: OpenAI Realtime API + Chat Completions API
- **Функционал**: Два режима (voice-to-voice, voice-to-text/code)
- **Тестирование**: Jest (minimalный coverage)
- **Архитектура**: Монолит без четкого разделения слоев

---

## 🎯 Целевой стек (по требованиям)

| Компонент | Текущее | Целевое | Приоритет |
|-----------|--------|--------|-----------|
| **Frontend** | HTML5 + Vanilla JS | React 18+ / Next.js 14+ | 🔴 Высокий |
| **Backend** | PHP | Node.js (Express/Fastify) | 🔴 Высокий |
| **API Gateway** | REST (implicit) | GraphQL + REST (OpenAPI) | 🟡 Средний |
| **LLM Orchestration** |직접OpenAI calls | LangChain / LangGraph | 🔴 Высокий |
| **Database** | - | PostgreSQL + Vector DB (Pinecone/Weaviate) | 🟡 Средний |
| **Observability** | - | OpenTelemetry + Langfuse | 🟡 Средний |
| **Infrastructure** | Manual | Docker + CI/CD (GitHub Actions) | 🟡 Средний |
| **AI Evaluation** | - | Langfuse + Custom metrics | 🟠 Низкий |

---

## 📁 Целевая структура проекта

```
boltalka-ai-native/
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── core/
│   │   │   │   ├── llm/                    # LLM orchestration layer
│   │   │   │   │   ├── chains/             # LangChain chains
│   │   │   │   │   ├── agents/             # LangGraph agents
│   │   │   │   │   ├── models/             # Model configs
│   │   │   │   │   ├── prompts/            # System prompts
│   │   │   │   │   └── evaluation.ts       # LLM evaluation metrics
│   │   │   │   ├── voice/                  # Voice processing
│   │   │   │   │   ├── transcription.ts    # Whisper/STT
│   │   │   │   │   ├── tts.ts              # TTS
│   │   │   │   │   ├── vad.ts              # Voice activity detection
│   │   │   │   │   └── streaming.ts        # WebRTC streaming
│   │   │   │   ├── database/               # Data layer
│   │   │   │   │   ├── migrations/
│   │   │   │   │   ├── models/
│   │   │   │   │   └── vector-store/
│   │   │   │   └── observability/          # Monitoring & tracing
│   │   │   │       ├── telemetry.ts
│   │   │   │       ├── langfuse.ts
│   │   │   │       └── logging.ts
│   │   │   ├── api/
│   │   │   │   ├── graphql/               # GraphQL API
│   │   │   │   │   ├── schema/
│   │   │   │   │   ├── resolvers/
│   │   │   │   │   └── types/
│   │   │   │   ├── rest/                  # REST API (OpenAPI)
│   │   │   │   │   ├── routes/
│   │   │   │   │   ├── controllers/
│   │   │   │   │   └── middleware/
│   │   │   │   └── websocket/             # WebSocket (realtime)
│   │   │   │       └── handlers/
│   │   │   ├── services/
│   │   │   │   ├── conversation.service.ts
│   │   │   │   ├── rag.service.ts
│   │   │   │   ├── code-expert.service.ts
│   │   │   │   └── voice.service.ts
│   │   │   ├── auth/                      # OAuth2 + JWT
│   │   │   │   ├── strategies/
│   │   │   │   ├── middleware/
│   │   │   │   └── jwt.handler.ts
│   │   │   ├── utils/
│   │   │   ├── config/
│   │   │   ├── types/
│   │   │   ├── constants/
│   │   │   └── main.ts                    # Entry point
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   ├── integration/
│   │   │   ├── e2e/
│   │   │   └── fixtures/
│   │   ├── docker/
│   │   ├── .env.example
│   │   ├── tsconfig.json
│   │   ├── jest.config.js
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── voice/
│   │   │   │   │   ├── VoiceRecorder.tsx
│   │   │   │   │   ├── AudioPlayer.tsx
│   │   │   │   │   └── VADToggle.tsx
│   │   │   │   ├── chat/
│   │   │   │   │   ├── ChatWindow.tsx
│   │   │   │   │   ├── MessageList.tsx
│   │   │   │   │   └── CodeBlock.tsx
│   │   │   │   ├── settings/
│   │   │   │   └── layout/
│   │   │   ├── pages/
│   │   │   │   ├── boltalka.tsx            # Voice-to-voice mode
│   │   │   │   ├── coder.tsx               # Voice-to-code mode
│   │   │   │   └── settings.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useVoiceRecorder.ts
│   │   │   │   ├── useAIChat.ts
│   │   │   │   └── useWebRTC.ts
│   │   │   ├── services/
│   │   │   │   ├── api.client.ts          # GraphQL + REST client
│   │   │   │   ├── websocket.client.ts    # WebSocket client
│   │   │   │   └── audio.service.ts
│   │   │   ├── store/
│   │   │   │   ├── conversation.store.ts  # State management (Zustand)
│   │   │   │   └── settings.store.ts
│   │   │   ├── utils/
│   │   │   ├── types/
│   │   │   ├── styles/
│   │   │   ├── app.tsx
│   │   │   └── main.tsx
│   │   ├── public/
│   │   ├── tests/
│   │   ├── .env.example
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   ├── package.json
│   │   └── next.config.js
│   │
│   └── shared/
│       ├── types/                        # Shared TS types
│       ├── constants/
│       ├── utils/
│       └── package.json
│
├── infra/
│   ├── docker-compose.yml                # Local development
│   ├── docker-compose.prod.yml
│   ├── kubernetes/                       # K8s manifests (future)
│   ├── scripts/
│   └── monitoring/
│       ├── prometheus.yml
│       ├── grafana/
│       └── langfuse-config/
│
├── .github/
│   └── workflows/
│       ├── ci.yml                        # Test + Lint
│       ├── build.yml                     # Docker build
│       └── deploy.yml                    # Auto-deploy
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md                           # GraphQL + REST docs
│   ├── LLM_DESIGN.md
│   └── DEPLOYMENT.md
│
├── .env.example
├── pnpm-workspace.yaml                  # Monorepo
├── turbo.json                           # Build orchestration
└── package.json
```

---

## 🚀 План рефакторинга (этапы)

### **ФАЗА 1: Подготовка инфраструктуры (Неделя 1-2)**

#### 1.1 Настройка монорепо и инструментария
- [ ] Инициализировать pnpm workspace
- [ ] Настроить Turborepo для сборки/тестирования
- [ ] Добавить Turbo cache для оптимизации
- [ ] Настроить TypeScript для всех пакетов
- [ ] Добавить ESLint + Prettier конфиги

**Dependencies:**
```json
{
  "devDependencies": {
    "turbo": "^1.10",
    "typescript": "^5.2",
    "eslint": "^8.50",
    "prettier": "^3.0",
    "@typescript-eslint/eslint-plugin": "^6.0",
    "@typescript-eslint/parser": "^6.0"
  }
}
```

#### 1.2 Инициализировать Backend (Node.js)
- [ ] Создать проект backend на Fastify + TypeScript
- [ ] Добавить базовую структуру Express-like routing
- [ ] Настроить конфигурацию для разных env (dev, test, prod)
- [ ] Добавить базовое логирование (Pino)

**Dependencies:**
```json
{
  "dependencies": {
    "fastify": "^4.24",
    "pino": "^8.16",
    "dotenv": "^16.3",
    "@fastify/cors": "^8.4",
    "@fastify/jwt": "^7.5",
    "@fastify/websocket": "^9.0"
  }
}
```

#### 1.3 Инициализировать Frontend (React + Next.js)
- [ ] Создать Next.js 14+ проект с App Router
- [ ] Настроить TypeScript + ESLint
- [ ] Добавить Tailwind CSS или Bootstrap интеграцию
- [ ] Настроить базовую структуру компонентов

**Dependencies:**
```json
{
  "dependencies": {
    "next": "^14.0",
    "react": "^18.2",
    "typescript": "^5.2",
    "zustand": "^4.4",
    "axios": "^1.6",
    "graphql-request": "^6.0"
  }
}
```

#### 1.4 Настроить Docker окружение
- [ ] Создать Dockerfile для backend (Node.js)
- [ ] Создать Dockerfile для frontend (Next.js)
- [ ] Добавить docker-compose.yml для локальной разработки
- [ ] Добавить PostgreSQL + Redis контейнеры

---

### **ФАЗА 2: Рефакторинг Backend - LLM слой (Неделя 3-4)**

#### 2.1 Установить LangChain + LangGraph экосистему
- [ ] `npm install langchain @langchain/openai @langchain/community`
- [ ] Создать базовые chains для каждого режима:
  - Voice-to-voice conversation chain
  - Code expert chain (transcription + code generation)
- [ ] Интегрировать Prompt Templates (переместить из PHP)

**Пример chain structure:**
```typescript
// src/core/llm/chains/conversation-chain.ts
import { LLMChain } from "langchain/chains";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "langchain/prompts";

export const createConversationChain = () => {
  const model = new ChatOpenAI({ modelName: "gpt-4o-mini-realtime" });
  const systemPrompt = PromptTemplate.fromTemplate(`...`);
  return new LLMChain({ llm: model, prompt: systemPrompt });
};
```

#### 2.2 Создать LangGraph агентов для сложной логики
- [ ] Voice conversation agent (с историей, контекстом)
- [ ] Code expert agent (с анализом requirements)
- [ ] RAG agent (для поиска документации)

#### 2.3 Интегрировать Vector Store для RAG
- [ ] Добавить Pinecone/Weaviate/Qdrant как VectorStore
- [ ] Создать embeddings pipeline (OpenAI embeddings)
- [ ] Реализовать RAG service для контекстного поиска

**Dependencies:**
```json
{
  "dependencies": {
    "langchain": "^0.1.0",
    "@langchain/openai": "^0.0.13",
    "@langchain/core": "^0.1.0",
    "langsmith": "^0.1.0",
    "@pinecone-database/pinecone": "^1.0"
  }
}
```

#### 2.4 Интегрировать Langfuse для трассировки LLM
- [ ] Добавить Langfuse клиент для всех LLM calls
- [ ] Логировать: prompts, responses, latency, token usage
- [ ] Добавить метрики评ки качества (accuracy, relevance)
- [ ] Создать dashboard для мониторинга

**Dependencies:**
```json
{
  "dependencies": {
    "langfuse": "^2.0"
  }
}
```

---

### **ФАЗА 3: Рефакторинг Backend - API слой (Неделя 5-6)**

#### 3.1 Создать REST API (OpenAPI/Swagger)
- [ ] Миграция endpoints из PHP в Fastify routes
- [ ] Реализовать основные endpoints:
  - `POST /api/voice/transcribe` - STT
  - `POST /api/chat/message` - Send message
  - `GET /api/chat/history` - Get conversation history
  - `POST /api/voice/config` - Get voice config
  - `PUT /api/user/settings` - Update settings

**Пример:**
```typescript
// src/api/rest/routes/chat.routes.ts
import { FastifyInstance } from "fastify";
import { chatController } from "../controllers/chat.controller";

export async function chatRoutes(fastify: FastifyInstance) {
  fastify.post("/api/chat/message", chatController.sendMessage);
  fastify.get("/api/chat/history", chatController.getHistory);
}
```

#### 3.2 Создать GraphQL API
- [ ] Настроить Apollo Server + Fastify
- [ ] Определить GraphQL schema:
  - `Query`: getConversations, getSettings
  - `Mutation`: sendMessage, updateSettings, clearChat
  - `Subscription`: onMessage (realtime)
- [ ] Создать resolvers для всех операций

**Schema пример:**
```graphql
type Query {
  conversation(id: ID!): Conversation
  settings: UserSettings
}

type Mutation {
  sendMessage(input: SendMessageInput!): Message
  updateSettings(input: UpdateSettingsInput!): UserSettings
}

type Subscription {
  messageReceived: Message
}
```

#### 3.3 Создать WebSocket слой
- [ ] Реализовать WebSocket handler для realtime streaming
- [ ] Voice audio streaming (binary frames)
- [ ] Chat messages streaming
- [ ] Connection lifecycle management

**Dependencies:**
```json
{
  "dependencies": {
    "@apollo/server": "^4.9",
    "graphql": "^16.8",
    "@fastify/apollo-gateway": "^1.0",
    "ws": "^8.14"
  }
}
```

#### 3.4 Добавить Authentication (OAuth2 + JWT)
- [ ] Реализовать JWT middleware для всех protected routes
- [ ] Добавить OAuth2 поддержку (Google, GitHub)
- [ ] Создать refresh token механизм
- [ ] Session management

---

### **ФАЗА 4: Рефакторинг Backend - Data слой (Неделя 7-8)**

#### 4.1 Настроить PostgreSQL
- [ ] Создать schema для:
  - Users (with OAuth profiles)
  - Conversations
  - Messages
  - User settings
  - Voice configurations
- [ ] Настроить migrations (TypeORM/Prisma)
- [ ] Индексы для оптимизации запросов

**Пример schema:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  mode VARCHAR(50), -- 'voice', 'code_expert'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  role VARCHAR(50), -- 'user', 'assistant'
  content TEXT,
  tokens_used INT,
  created_at TIMESTAMP
);
```

#### 4.2 Интегрировать Vector Database
- [ ] Настроить Pinecone/Qdrant для embeddings
- [ ] Pipeline: text → embedding → vector store
- [ ] Indexing стратегия для conversations
- [ ] Поиск similar conversations для в context

#### 4.3 Создать ORM layer
- [ ] Выбрать Prisma или TypeORM
- [ ] Создать repository pattern для data access
- [ ] Кэширование часто используемых данных (Redis)

**Dependencies:**
```json
{
  "dependencies": {
    "@prisma/client": "^5.4",
    "redis": "^4.6",
    "@fastify/redis": "^1.0"
  }
}
```

---

### **ФАЗА 5: Рефакторинг Backend - Observability (Неделя 9)**

#### 5.1 Настроить OpenTelemetry
- [ ] Добавить trace provider для всех operations
- [ ] Instrumentate: HTTP requests, LLM calls, database queries
- [ ] Экспорт трейсов в OTLP collector
- [ ] Интеграция с Jaeger/Datadog

#### 5.2 Настроить Prometheus metrics
- [ ] Счетчики: requests, errors, LLM tokens
- [ ] Гаджеты: response time, LLM latency
- [ ] Histogram: distribution анализ

#### 5.3 Интегрировать Datadog (optional)
- [ ] APM агент для Node.js
- [ ] RUM для frontend
- [ ] Log aggregation
- [ ] Alert management

**Dependencies:**
```json
{
  "dependencies": {
    "@opentelemetry/api": "^1.7",
    "@opentelemetry/sdk-node": "^0.44",
    "@opentelemetry/auto-instrumentations-node": "^0.39",
    "prom-client": "^15.0",
    "dd-trace": "^5.0"
  }
}
```

#### 5.4 Создать LLM evaluation pipeline
- [ ] Метрики качества: relevance, coherence, accuracy
- [ ] Automated testing с Langsmith
- [ ] A/B testing infrastructure для prompts
- [ ] Feedback loop от users

---

### **ФАЗА 6: Рефакторинг Frontend (Неделя 10-12)**

#### 6.1 Мигрировать UI с HTML в React компоненты
- [ ] `VoiceRecorder` компонент (WebRTC)
- [ ] `ChatWindow` компонент (messages display)
- [ ] `AudioPlayer` компонент (response playback)
- [ ] `Settings` компонент (configuration)

**Пример:**
```typescript
// src/components/voice/VoiceRecorder.tsx
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

export const VoiceRecorder: React.FC = () => {
  const { isRecording, startRecording, stopRecording, audioBlob } = useVoiceRecorder();
  
  return (
    <button onClick={isRecording ? stopRecording : startRecording}>
      {isRecording ? "🔴 Recording..." : "🎤 Start"}
    </button>
  );
};
```

#### 6.2 Создать custom hooks для логики
- [ ] `useVoiceRecorder` - Recording + VAD logic
- [ ] `useAIChat` - Chat state + message handling
- [ ] `useWebRTC` - WebRTC connection management
- [ ] `useAuth` - Authentication flow

#### 6.3 Реализовать state management (Zustand)
- [ ] `conversationStore` - Messages, history
- [ ] `settingsStore` - User preferences
- [ ] `connectionStore` - WebSocket/API connection status

#### 6.4 Создать API client
- [ ] GraphQL client (urql or apollo-client)
- [ ] REST client для fallback
- [ ] WebSocket client for realtime
- [ ] Error handling + retry logic

**Dependencies:**
```json
{
  "dependencies": {
    "zustand": "^4.4",
    "@urql/core": "^4.0",
    "graphql-request": "^6.0",
    "axios": "^1.6"
  }
}
```

#### 6.5 Добавить правильную обработку асинхронности
- [ ] Streaming responses (OpenAI Realtime API)
- [ ] Audio streaming (WebRTC)
- [ ] Error boundaries for robust UX
- [ ] Loading states + skeletons

#### 6.6 Создать две основные страницы
- [ ] `/boltalka` - Voice-to-voice conversation
- [ ] `/coder` - Code expert (voice-to-code)
- [ ] `/settings` - User preferences
- [ ] `/history` - Conversation history

---

### **ФАЗА 7: Testing & Quality (Неделя 13)**

#### 7.1 Backend тестирование
- [ ] Unit tests для services (Jest)
- [ ] Integration tests для API endpoints
- [ ] E2E тесты для komplетных flows
- [ ] Порог: 80%+ coverage

**Example:**
```typescript
// tests/unit/llm/conversation-chain.test.ts
describe("ConversationChain", () => {
  it("should respond with relevant message", async () => {
    const chain = createConversationChain();
    const response = await chain.call({ input: "Hello" });
    expect(response).toBeDefined();
  });
});
```

#### 7.2 Frontend тестирование
- [ ] Component tests (Vitest + React Testing Library)
- [ ] Hook tests
- [ ] Integration tests
- [ ] Pороговое значение: 75%+ coverage

#### 7.3 Добавить типизацию
- [ ] Strict TypeScript mode
- [ ] Shared types package для frontend/backend
- [ ] API contract testing

#### 7.4 Добавить lint + format rules
- [ ] ESLint с airbnb config
- [ ] Prettier форматирование
- [ ] Pre-commit hooks (husky)
- [ ] CI/CD pipeline для проверок

**Dependencies:**
```json
{
  "devDependencies": {
    "jest": "^29.7",
    "vitest": "^1.0",
    "@testing-library/react": "^14.1",
    "@testing-library/jest-dom": "^6.1",
    "husky": "^8.0",
    "lint-staged": "^15.0",
    "ts-jest": "^29.1"
  }
}
```

---

### **ФАЗА 8: Infrastructure & Deployment (Неделя 14-15)**

#### 8.1 Docker & Containerization
- [ ] Optimized Dockerfile для backend (multi-stage)
- [ ] Optimized Dockerfile для frontend
- [ ] docker-compose для локальной разработки

**Пример Dockerfile (backend):**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN corepack enable && pnpm ci
COPY . .
RUN pnpm build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

#### 8.2 CI/CD Pipeline (GitHub Actions)
- [ ] Lint checks + unit tests on PR
- [ ] Build Docker images on merge
- [ ] Push to registry (Docker Hub / GitHub Packages)
- [ ] Deploy to staging/production

**Пример workflow:**
```yaml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm ci
      - run: pnpm lint
      - run: pnpm test:ci

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: docker/build-push-action@v4
        with:
          push: true
          tags: user/repo:${{ github.sha }}
```

#### 8.3 Kubernetes (optional для масштабирования)
- [ ] Service, Deployment manifests
- [ ] ConfigMaps для конфигурации
- [ ] Secrets для API ключей
- [ ] HPA для auto-scaling

#### 8.4 Monitoring & Logging Infrastructure
- [ ] Prometheus + Grafana для metrics
- [ ] ELK Stack (Elasticsearch, Logstash, Kibana) для логов
- [ ] Langfuse dashboard для LLM tracking
- [ ] Alert rules для critical issues

---

### **ФАЗА 9: Documentation & Handoff (Неделя 16)**

#### 9.1 Техническая документация
- [ ] ARCHITECTURE.md - System design overview
- [ ] API.md - REST + GraphQL endpoints
- [ ] LLM_DESIGN.md - Chain/Agent design decisions
- [ ] DEPLOYMENT.md - Production deployment guide

#### 9.2 Developer guide
- [ ] Setup инструкции для нового разработчика
- [ ] Contributing guidelines
- [ ] Release process documentation
- [ ] Troubleshooting guide

#### 9.3 Operations guide
- [ ] Runbook для common issues
- [ ] Monitoring & alerting setup
- [ ] Scaling strategy
- [ ] Disaster recovery procedures

---

## 📊 Временная шкала

| Фаза | Неделя | Основной фокус | Deliverables |
|------|--------|---|---|
| 1 | 1-2 | Infrastructure Setup | Monorepo, Docker, CI/CD basics |
| 2 | 3-4 | LLM Layer | LangChain chains, Langfuse integration |
| 3 | 5-6 | API Layer | REST + GraphQL APIs |
| 4 | 7-8 | Data Layer | PostgreSQL, Vector DB, ORM |
| 5 | 9 | Observability | OpenTelemetry, Prometheus, metrics |
| 6 | 10-12 | Frontend | React components, hooks, state |
| 7 | 13 | Testing | Full test coverage, quality gates |
| 8 | 14-15 | Infrastructure | Docker, CI/CD, Kubernetes |
| 9 | 16 | Documentation | Tech docs, deployment guides |

**Итого: 16 недель** (4 месяца на полный рефакторинг)

---

## 🎯 Критические метрики успеха

### Backend
- [ ] 100% TypeScript coverage
- [ ] 80%+ unit/integration test coverage
- [ ] Zero security vulnerabilities
- [ ] API latency < 200ms (p95)
- [ ] LLM response time < 5s (with streaming)
- [ ] Uptime: 99.5%+

### Frontend
- [ ] Lighthouse score: 90+
- [ ] Core Web Vitals: Good
- [ ] 75%+ component test coverage
- [ ] Bundle size: < 200KB (gzipped)
- [ ] SSR + Static Generation

### LLM/AI
- [ ] Prompt version control in Langsmith
- [ ] A/B testing framework for prompts
- [ ] Automated evaluation pipeline
- [ ] Cost tracking (tokens per operation)
- [ ] User feedback loop integration

### DevOps
- [ ] CI/CD pipeline: build < 5min
- [ ] Deployment downtime: 0min
- [ ] Container image: < 500MB
- [ ] Database backup: daily
- [ ] Monitoring: 99%+ uptime

---

## 🛠 Инструменты и библиотеки по категориям

### Backend Stack
```json
{
  "framework": "fastify@^4.24",
  "orm": "@prisma/client@^5.4",
  "llm": [
    "langchain@^0.1",
    "@langchain/openai@^0.0.13",
    "langsmith@^0.1"
  ],
  "api": [
    "@apollo/server@^4.9",
    "graphql@^16.8"
  ],
  "observability": [
    "@opentelemetry/sdk-node",
    "@opentelemetry/auto-instrumentations-node",
    "prom-client@^15.0",
    "langfuse@^2.0"
  ],
  "auth": "@fastify/jwt@^7.5",
  "logging": "pino@^8.16",
  "testing": [
    "jest@^29.7",
    "@testing-library/jest-dom@^6.1"
  ],
  "code-quality": [
    "eslint@^8.50",
    "@typescript-eslint/eslint-plugin@^6.0",
    "prettier@^3.0"
  ]
}
```

### Frontend Stack
```json
{
  "framework": "next.js@^14.0",
  "ui": ["react@^18.2", "react-dom@^18.2"],
  "state": "zustand@^4.4",
  "api": [
    "graphql-request@^6.0",
    "axios@^1.6",
    "urql@^4.0"
  ],
  "styling": [
    "tailwindcss@^3.3",
    "clsx@^2.0"
  ],
  "audio": "wavesurfer.js@^6.3",
  "testing": [
    "vitest@^1.0",
    "@testing-library/react@^14.1"
  ]
}
```

### Infrastructure
```yaml
# Containers & Orchestration
- Docker & Docker Compose
- Kubernetes (optional)

# Databases
- PostgreSQL (primary DB)
- Pinecone / Qdrant (vector store)
- Redis (caching)

# Monitoring & Observability
- Prometheus (metrics)
- Grafana (visualization)
- Jaeger (distributed tracing)
- ELK Stack (logging)
- Datadog (optional APM)

# CI/CD
- GitHub Actions (pipelines)
- Docker Registry
- Semantic Release (versioning)

# LLM Observability
- Langfuse (LLM monitoring)
- Langsmith (evaluation)
```

---

## 🚨 Рекомендации и best practices

### 1. **Миграция данных**
- Создать migration script для existing conversations из старого формата
- Обеспечить data consistency между старой и новой системой
- Двойная запись (dual-write) в переходный период

### 2. **API Backward Compatibility**
- Поддерживать старые endpoints в течение 2-3 месяцев
- API versioning strategy (v1, v2)
- Deprecation warnings в ответах

### 3. **Performance Optimization**
- Кэширование часто используемых промптов
- Connection pooling для БД
- CDN для статических assets
- Request batching для GraphQL

### 4. **Security**
- API rate limiting (Token bucket)
- Input validation + sanitization
- CORS + CSRF protection
- Secrets management (AWS Secrets Manager / HashiCorp Vault)
- HTTPS enforcement
- JWT rotation strategy

### 5. **Cost Optimization**
- Token usage tracking для OpenAI API
- Batch processing для non-realtime requests
- Model selection logic (gpt-4 vs gpt-4o-mini)
- Caching хитростей для embeddings

### 6. **Reliability**
- Error recovery strategies
- Circuit breaker pattern для external APIs
- Retry logic с exponential backoff
- Graceful degradation (fallback modes)

---

## 🎓 Владение техс-стеком (Checklist)

### TypeScript & Architecture
- [ ] Strict typing везде (no `any`)
- [ ] Repository pattern для data access
- [ ] Dependency injection для services
- [ ] SOLID principles compliance

### LLM/AI Специфичное
- [ ] Понимание prompt engineering
- [ ] Experience с LangChain chains/agents
- [ ] RAG pipeline implementation
- [ ] Evaluation metrics для LLM outputs
- [ ] Token management и cost tracking

### DevOps & Infrastructure
- [ ] Docker multi-stage builds
- [ ] CI/CD pipeline design
- [ ] Database migration strategy
- [ ] Monitoring + alerting setup
- [ ] Horizontal scaling approach

### Frontend (React/Next.js)
- [ ] Serverside rendering (SSR)
- [ ] Static site generation (SSG)
- [ ] Client-side optimization
- [ ] Web Audio API integration

---

## 📚 Дополнительные ресурсы

### Документация
- LangChain: https://js.langchain.com/
- Fastify: https://www.fastify.io/
- Next.js: https://nextjs.org/
- GraphQL: https://graphql.org/
- OpenTelemetry: https://opentelemetry.io/

### Best Practices
- 12 Factor App: https://12factor.net/
- Design Patterns: https://refactoring.guru/design-patterns
- System Design: https://grokking-system-design.vercel.app/

---

## ✅ Заключение

Этот план обеспечит трансформацию Boltalka из legacy PHP application в современный, масштабируемый AI-native продукт с enterprise-grade архитектурой. Каждая фаза имеет четкие deliverables и может быть отслеживаться независимо.

**Ключевые преимущества:**
✅ Full TypeScript type safety  
✅ LLM orchestration с LangChain/LangGraph  
✅ Production observability (traces, metrics, logs)  
✅ Scalable architecture (microservices-ready)  
✅ Modern tooling & best practices  
✅ Strong testing & quality gates  
✅ AI evaluation pipeline  
✅ Enterprise-ready security & compliance  

