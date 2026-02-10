# 🔄 Refactoring Plan for Boltalka under AI-native Tech Lead Stack

## 📋 Current Project Status

**Boltalka Voice Bot v9.0.0**
- **Frontend**: HTML5 (vanilla JS) + Bootstrap 5 + WebRTC
- **Backend**: PHP (Litespeed/Apache/Nginx)
- **API**: OpenAI Realtime API + Chat Completions API
- **Functionality**: Two modes (voice-to-voice, voice-to-text/code)
- **Testing**: Jest (minimal coverage)
- **Architecture**: Monolith without clear layer separation

---

## 🎯 Target Stack (per requirements)

| Component | Current | Target | Priority |
|-----------|---------|--------|----------|
| **Frontend** | HTML5 + Vanilla JS | React 18+ / Next.js 14+ | 🔴 High |
| **Backend** | PHP | Node.js (Express/Fastify) | 🔴 High |
| **API Gateway** | REST (implicit) | GraphQL + REST (OpenAPI) | 🟡 Medium |
| **LLM Orchestration** | Direct OpenAI calls | LangChain / LangGraph | 🔴 High |
| **Database** | - | PostgreSQL + Vector DB (Pinecone/Weaviate) | 🟡 Medium |
| **Observability** | - | OpenTelemetry + Langfuse | 🟡 Medium |
| **Infrastructure** | Manual | Docker + CI/CD (GitHub Actions) | 🟡 Medium |
| **AI Evaluation** | - | Langfuse + Custom metrics | 🟠 Low |

---

## 📁 Target Project Structure

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

## 🚀 Refactoring Plan (Phases)

### **PHASE 1: Infrastructure Preparation (Week 1-2)**

#### 1.1 Setup monorepo and tooling
- [ ] Initialize pnpm workspace
- [ ] Configure Turborepo for build/testing
- [ ] Add Turbo cache for optimization
- [ ] Configure TypeScript for all packages
- [ ] Add ESLint + Prettier configs

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

#### 1.2 Initialize Backend (Node.js)
- [ ] Create backend project on Fastify + TypeScript
- [ ] Add basic Express-like routing structure
- [ ] Configure for different environments (dev, test, prod)
- [ ] Add basic logging (Pino)

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

#### 1.3 Initialize Frontend (React + Next.js)
- [ ] Create Next.js 14+ project with App Router
- [ ] Configure TypeScript + ESLint
- [ ] Add Tailwind CSS or Bootstrap integration
- [ ] Configure basic component structure

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

#### 1.4 Configure Docker environment
- [ ] Create Dockerfile for backend (Node.js)
- [ ] Create Dockerfile for frontend (Next.js)
- [ ] Add docker-compose.yml for local development
- [ ] Add PostgreSQL + Redis containers

---

### **PHASE 2: Backend Refactoring - LLM Layer (Week 3-4)**

#### 2.1 Install LangChain + LangGraph ecosystem
- [ ] `npm install langchain @langchain/openai @langchain/community`
- [ ] Create basic chains for each mode:
  - Voice-to-voice conversation chain
  - Code expert chain (transcription + code generation)
- [ ] Integrate Prompt Templates (migrate from PHP)

**Example chain structure:**
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

#### 2.2 Create LangGraph agents for complex logic
- [ ] Voice conversation agent (with history and context)
- [ ] Code expert agent (with requirements analysis)
- [ ] RAG agent (for documentation search)

#### 2.3 Integrate Vector Store for RAG
- [ ] Add Pinecone/Weaviate/Qdrant as VectorStore
- [ ] Create embeddings pipeline (OpenAI embeddings)
- [ ] Implement RAG service for context search

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

#### 2.4 Integrate Langfuse for LLM tracing
- [ ] Add Langfuse client for all LLM calls
- [ ] Log: prompts, responses, latency, token usage
- [ ] Add quality metrics (accuracy, relevance)
- [ ] Create monitoring dashboard

**Dependencies:**
```json
{
  "dependencies": {
    "langfuse": "^2.0"
  }
}
```

---

### **PHASE 3: Backend Refactoring - API Layer (Week 5-6)**

#### 3.1 Create REST API (OpenAPI/Swagger)
- [ ] Migrate endpoints from PHP to Fastify routes
- [ ] Implement main endpoints:
  - `POST /api/voice/transcribe` - STT
  - `POST /api/chat/message` - Send message
  - `GET /api/chat/history` - Get conversation history
  - `POST /api/voice/config` - Get voice config
  - `PUT /api/user/settings` - Update settings

**Example:**
```typescript
// src/api/rest/routes/chat.routes.ts
import { FastifyInstance } from "fastify";
import { chatController } from "../controllers/chat.controller";

export async function chatRoutes(fastify: FastifyInstance) {
  fastify.post("/api/chat/message", chatController.sendMessage);
  fastify.get("/api/chat/history", chatController.getHistory);
}
```

#### 3.2 Create GraphQL API
- [ ] Configure Apollo Server + Fastify
- [ ] Define GraphQL schema:
  - `Query`: getConversations, getSettings
  - `Mutation`: sendMessage, updateSettings, clearChat
  - `Subscription`: onMessage (realtime)
- [ ] Create resolvers for all operations

**Schema example:**
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

#### 3.3 Create WebSocket layer
- [ ] Implement WebSocket handler for realtime streaming
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

#### 3.4 Add Authentication (OAuth2 + JWT)
- [ ] Implement JWT middleware for all protected routes
- [ ] Add OAuth2 support (Google, GitHub)
- [ ] Create refresh token mechanism
- [ ] Session management

---

### **PHASE 4: Backend Refactoring - Data Layer (Week 7-8)**

#### 4.1 Configure PostgreSQL
- [ ] Create schema for:
  - Users (with OAuth profiles)
  - Conversations
  - Messages
  - User settings
  - Voice configurations
- [ ] Configure migrations (TypeORM/Prisma)
- [ ] Indexes for query optimization

**Example schema:**
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

#### 4.2 Integrate Vector Database
- [ ] Configure Pinecone/Qdrant for embeddings
- [ ] Pipeline: text → embedding → vector store
- [ ] Indexing strategy for conversations
- [ ] Search similar conversations for context

#### 4.3 Create ORM layer
- [ ] Choose Prisma or TypeORM
- [ ] Create repository pattern for data access
- [ ] Cache frequently used data (Redis)

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

### **PHASE 5: Backend Refactoring - Observability (Week 9)**

#### 5.1 Configure OpenTelemetry
- [ ] Add trace provider for all operations
- [ ] Instrument: HTTP requests, LLM calls, database queries
- [ ] Export traces to OTLP collector
- [ ] Integrate with Jaeger/Datadog

#### 5.2 Configure Prometheus metrics
- [ ] Counters: requests, errors, LLM tokens
- [ ] Gauges: response time, LLM latency
- [ ] Histogram: distribution analysis

#### 5.3 Integrate Datadog (optional)
- [ ] APM agent for Node.js
- [ ] RUM for frontend
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

#### 5.4 Create LLM evaluation pipeline
- [ ] Quality metrics: relevance, coherence, accuracy
- [ ] Automated testing with Langsmith
- [ ] A/B testing infrastructure for prompts
- [ ] User feedback loop integration

---

### **PHASE 6: Frontend Refactoring (Week 10-12)**

#### 6.1 Migrate UI from HTML to React components
- [ ] `VoiceRecorder` component (WebRTC)
- [ ] `ChatWindow` component (messages display)
- [ ] `AudioPlayer` component (response playback)
- [ ] `Settings` component (configuration)

**Example:**
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

#### 6.2 Create custom hooks for logic
- [ ] `useVoiceRecorder` - Recording + VAD logic
- [ ] `useAIChat` - Chat state + message handling
- [ ] `useWebRTC` - WebRTC connection management
- [ ] `useAuth` - Authentication flow

#### 6.3 Implement state management (Zustand)
- [ ] `conversationStore` - Messages, history
- [ ] `settingsStore` - User preferences
- [ ] `connectionStore` - WebSocket/API connection status

#### 6.4 Create API client
- [ ] GraphQL client (urql or apollo-client)
- [ ] REST client for fallback
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

#### 6.5 Add proper async handling
- [ ] Streaming responses (OpenAI Realtime API)
- [ ] Audio streaming (WebRTC)
- [ ] Error boundaries for robust UX
- [ ] Loading states + skeletons

#### 6.6 Create main pages
- [ ] `/boltalka` - Voice-to-voice conversation
- [ ] `/coder` - Code expert (voice-to-code)
- [ ] `/settings` - User preferences
- [ ] `/history` - Conversation history

---

### **PHASE 7: Testing & Quality (Week 13)**

#### 7.1 Backend testing
- [ ] Unit tests for services (Jest)
- [ ] Integration tests for API endpoints
- [ ] E2E tests for complete flows
- [ ] Threshold: 80%+ coverage

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

#### 7.2 Frontend testing
- [ ] Component tests (Vitest + React Testing Library)
- [ ] Hook tests
- [ ] Integration tests
- [ ] Coverage threshold: 75%+

#### 7.3 Add strict typing
- [ ] Strict TypeScript mode
- [ ] Shared types package for frontend/backend
- [ ] API contract testing

#### 7.4 Add lint + format rules
- [ ] ESLint with airbnb config
- [ ] Prettier formatting
- [ ] Pre-commit hooks (husky)
- [ ] CI/CD pipeline for checks

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

### **PHASE 8: Infrastructure & Deployment (Week 14-15)**

#### 8.1 Docker & Containerization
- [ ] Optimized Dockerfile for backend (multi-stage)
- [ ] Optimized Dockerfile for frontend
- [ ] docker-compose for local development

**Example Dockerfile (backend):**
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

**Example workflow:**
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

#### 8.3 Kubernetes (optional for scaling)
- [ ] Service, Deployment manifests
- [ ] ConfigMaps for configuration
- [ ] Secrets for API keys
- [ ] HPA for auto-scaling

#### 8.4 Monitoring & Logging Infrastructure
- [ ] Prometheus + Grafana for metrics
- [ ] ELK Stack (Elasticsearch, Logstash, Kibana) for logs
- [ ] Langfuse dashboard for LLM tracking
- [ ] Alert rules for critical issues

---

### **PHASE 9: Documentation & Handoff (Week 16)**

#### 9.1 Technical documentation
- [ ] ARCHITECTURE.md - System design overview
- [ ] API.md - REST + GraphQL endpoints
- [ ] LLM_DESIGN.md - Chain/Agent design decisions
- [ ] DEPLOYMENT.md - Production deployment guide

#### 9.2 Developer guide
- [ ] Setup instructions for new developer
- [ ] Contributing guidelines
- [ ] Release process documentation
- [ ] Troubleshooting guide

#### 9.3 Operations guide
- [ ] Runbook for common issues
- [ ] Monitoring & alerting setup
- [ ] Scaling strategy
- [ ] Disaster recovery procedures

---

## 📊 Timeline

| Phase | Week | Main Focus | Deliverables |
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

**Total: 16 weeks** (4 months for full refactoring)

---

## 🎯 Critical Success Metrics

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

## 🛠 Tools and Libraries by Category

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

## 🚨 Recommendations and Best Practices

### 1. **Data Migration**
- Create migration script for existing conversations from old format
- Ensure data consistency between old and new systems
- Dual-write strategy during transition period

### 2. **API Backward Compatibility**
- Support old endpoints for 2-3 months
- API versioning strategy (v1, v2)
- Deprecation warnings in responses

### 3. **Performance Optimization**
- Cache frequently used prompts
- Connection pooling for database
- CDN for static assets
- Request batching for GraphQL

### 4. **Security**
- API rate limiting (Token bucket)
- Input validation + sanitization
- CORS + CSRF protection
- Secrets management (AWS Secrets Manager / HashiCorp Vault)
- HTTPS enforcement
- JWT rotation strategy

### 5. **Cost Optimization**
- Token usage tracking for OpenAI API
- Batch processing for non-realtime requests
- Model selection logic (gpt-4 vs gpt-4o-mini)
- Caching strategies for embeddings

### 6. **Reliability**
- Error recovery strategies
- Circuit breaker pattern for external APIs
- Retry logic with exponential backoff
- Graceful degradation (fallback modes)

---

## 🎓 Tech Stack Mastery (Checklist)

### TypeScript & Architecture
- [ ] Strict typing everywhere (no `any`)
- [ ] Repository pattern for data access
- [ ] Dependency injection for services
- [ ] SOLID principles compliance

### LLM/AI Specifics
- [ ] Understanding of prompt engineering
- [ ] Experience with LangChain chains/agents
- [ ] RAG pipeline implementation
- [ ] Evaluation metrics for LLM outputs
- [ ] Token management and cost tracking

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

## 📚 Additional Resources

### Documentation
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

## ✅ Conclusion

This plan will transform Boltalka from a legacy PHP application into a modern, scalable AI-native product with enterprise-grade architecture. Each phase has clear deliverables and can be tracked independently.

**Key Advantages:**
✅ Full TypeScript type safety  
✅ LLM orchestration with LangChain/LangGraph  
✅ Production observability (traces, metrics, logs)  
✅ Scalable architecture (microservices-ready)  
✅ Modern tooling & best practices  
✅ Strong testing & quality gates  
✅ AI evaluation pipeline  
✅ Enterprise-ready security & compliance  

