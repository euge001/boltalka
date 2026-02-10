# 🚀 Quick Guide: Migration to AI-native Stack

## Current → Target (main replacements)

### **Frontend: HTML → React + Next.js**
```
CURRENT                          │  TARGET
─────────────────────────────────┼──────────────────────────
index.html (vanilla JS)          →  app/boltalka/page.tsx (React)
coder.html (vanilla JS)          →  app/coder/page.tsx (React)
app.js (440+ lines DOM logic)    →  hooks/useVoiceRecorder.ts
                                    hooks/useAIChat.ts
                                    components/VoiceRecorder.tsx
```

### **Backend: PHP → Node.js + TypeScript**
```
CURRENT                          │  TARGET
─────────────────────────────────┼──────────────────────────
token.php                        →  src/api/rest/routes/token.ts
chat.php                         →  src/services/chat.service.ts
config.php                       →  src/core/llm/chains/
                                    src/config/models.ts
(no API structure)               →  src/api/graphql/ + src/api/rest/
(PHP directly calls OpenAI)      →  LangChain chains + LangGraph agents
(no observability)               →  OpenTelemetry + Langfuse
```

### **API Layer: Implicit → Explicit**
```
CURRENT                          │  TARGET
─────────────────────────────────┼──────────────────────────
POST token.php                   →  POST /api/auth/token
                                    (JWT-based)

POST chat.php                    →  POST /api/chat/message (REST)
                                    mutation { sendMessage } (GraphQL)

Direct OpenAI API calls          →  LangChain chain.run()
                                    (abstraction layer)

No voice endpoint                →  POST /api/voice/transcribe
                                    WS /api/voice/stream (WebRTC)
```

### **LLM Layer: Raw API → Orchestrated**
```
CURRENT
───────────────────────────────────────
fetch("https://api.openai.com/v1/audio/transcriptions", {
  model: "whisper-1",
  file: audioBlob
})
→ send to chat.php
→ fetch("https://api.openai.com/v1/chat/completions", { ... })
→ return response

TARGET
───────────────────────────────────────
const transcriptionChain = createTranscriptionChain();
const codeExpertAgent = new CodeExpertAgent();

// More controllable with Langfuse tracing
const response = await codeExpertAgent.invoke({
  input: audioBlob,
  metadata: { userId, sessionId }
});
// Automatically logged to Langfuse dashboard
```

---

## 📦 Key New Packages

### Backend
```bash
# Core framework
npm install fastify @fastify/cors @fastify/jwt @fastify/websocket

# TypeScript & types
npm install typescript @types/node ts-node

# LLM orchestration
npm install langchain @langchain/openai langsmith

# API
npm install @apollo/server graphql graphql-tools

# Database
npm install @prisma/client prisma

# Vector store
npm install @pinecone-database/pinecone

# Observability
npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
npm install prom-client langfuse pino

# Auth
npm install jsonwebtoken bcryptjs

# Validation
npm install zod class-validator

# Testing
npm install jest @types/jest ts-jest

# Dev tooling
npm install eslint prettier @typescript-eslint/eslint-plugin husky lint-staged
```

### Frontend
```bash
# Core
npm install next react react-dom

# State
npm install zustand

# API clients
npm install graphql-request axios urql

# UI helpers
npm install clsx tailwindcss

# Audio
npm install wavesurfer.js react-use-gesture

# Testing
npm install vitest @testing-library/react

# Types
npm install typescript
```

---

## 🔄 Migration of Core Components

### 1. **Conversation State** (current)
```javascript
// app.js
let appConfig = null;
let selectedLanguage = 'en';
let selectedModel = 'gpt-4o-mini-realtime-preview';
let isMuted = false;
let vadMode = 'server_vad';

function setStatus(text) {
  statusEl.className = "badge text-bg-" + kind;
  statusEl.textContent = text;
}
```

### 1. **Conversation State** (target)
```typescript
// src/store/conversation.store.ts
import { create } from 'zustand';

interface ConversationState {
  messages: Message[];
  selectedModel: string;
  selectedLanguage: string;
  isMuted: boolean;
  vadMode: 'server_vad' | 'client_vad';
  status: 'idle' | 'recording' | 'processing' | 'responding';
  
  addMessage: (msg: Message) => void;
  setStatus: (status: Status) => void;
  updateSettings: (settings: Partial<ConversationState>) => void;
}

export const useConversationStore = create<ConversationState>((set) => ({
  messages: [],
  selectedModel: 'gpt-4o-mini-realtime-preview',
  status: 'idle',
  // ...methods
}));
```

---

### 2. **Voice Recording** (current)
```javascript
// app.js - 100+ lines
async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  // manual setup MediaRecorder
  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
  mediaRecorder.start();
}
```

### 2. **Voice Recording** (target)
```typescript
// src/hooks/useVoiceRecorder.ts
export const useVoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => setAudioBlob(new Blob(chunks, { type: 'audio/webm' }));
    
    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return { isRecording, startRecording, stopRecording, audioBlob };
};
```

---

### 3. **Token Endpoint** (current)
```php
<?php
// token.php
require_once 'config.php';

$client = new OpenAI\Client($apiKey);
$response = $client->audio()->speech(...$params);
echo json_encode($response);
?>
```

### 3. **Token Endpoint** (target)
```typescript
// src/api/rest/routes/auth.routes.ts
export async function authRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: TokenRequest }>('/api/auth/token', async (request, reply) => {
    // JWT generation
    const token = fastify.jwt.sign(
      { userId: request.user.id, exp: Date.now() + 3600000 },
      { expiresIn: '1h' }
    );
    
    return reply.send({ accessToken: token, expiresIn: 3600 });
  });
}

// src/api/graphql/types/auth.ts
export const authTypeDefs = gql`
  type TokenResponse {
    accessToken: String!
    expiresIn: Int!
  }
  
  type Mutation {
    getToken: TokenResponse!
  }
`;
```

---

### 4. **Chat Message** (current)
```javascript
// chat.php
$messages = json_decode($_POST['messages']);
$system_prompt = "You are a helpful assistant...";

$response = $client->chat()->create([
  'model' => $_POST['model'] ?? 'gpt-4o',
  'messages' => array_merge(
    [['role' => 'system', 'content' => $system_prompt]],
    $messages
  )
]);

echo json_encode(['content' => $response->choices[0]->message->content]);
```

### 4. **Chat Message** (target)
```typescript
// src/core/llm/chains/conversation-chain.ts
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ConversationChain } from "langchain/chains";

export const createConversationChain = () => {
  const model = new ChatOpenAI({
    modelName: "gpt-4o-mini-realtime-preview",
    temperature: 0.7,
  });

  return new ConversationChain({
    llm: model,
    memory: new BufferMemory({ returnMessages: true }),
  });
};

// src/services/chat.service.ts
export class ChatService {
  async sendMessage(
    conversationId: string,
    content: string,
    context?: string
  ): Promise<Message> {
    // Traced with Langfuse
    const response = await this.chain.call({
      input: content,
      context: context
    });
    
    // Save to DB
    await this.messageRepo.create({
      conversationId,
      role: 'assistant',
      content: response.text,
      tokensUsed: response.usage?.completion_tokens || 0
    });
    
    return response;
  }
}

// src/api/graphql/resolvers/chat.resolver.ts
export const chatResolvers = {
  Mutation: {
    sendMessage: async (_, { conversationId, input }) => {
      return chatService.sendMessage(conversationId, input);
    }
  }
};

// or REST endpoint
// src/api/rest/controller/chat.controller.ts
export const chatController = {
  sendMessage: async (request: FastifyRequest<{ Body: SendMessageRequest }>) => {
    const message = await chatService.sendMessage(
      request.body.conversationId,
      request.body.content
    );
    return message;
  }
};
```

---

## 📊 Architecture Comparison

### Current (PHP + Vanilla JS)
```
┌─────────────────┐
│   HTML Files    │  (index.html, coder.html)
│  Vanilla JS     │  (app.js, coder.js)
│  DOM Manipulation│ (manual event handling)
└────────┬────────┘
         │ Direct HTTP calls
         ▼
┌─────────────────────────────┐
│     PHP Scripts             │
│  token.php, chat.php        │
│  config.php, etc            │
│ (Direct OpenAI calls)       │
└────────┬────────────────────┘
         │ HTTPS
         ▼
   OpenAI API
```

**Problems:**
❌ Mixing concerns (UI + logic)
❌ No abstraction over LLM
❌ No structured observability
❌ No typing
❌ No scalability
❌ Hard to test

---

### Target (Node.js + React)
```
┌─────────────────────────────────┐
│   React/Next.js Frontend        │
│  ├─ Pages (Boltalka, Coder)     │
│  ├─ Components (VoiceRecorder)  │
│  ├─ Hooks (useVoiceRecorder)    │
│  └─ Store (Zustand)             │
└────────┬────────────────────────┘
         │ GraphQL/REST/WS
         ▼
┌──────────────────────────────────────────────┐
│        Node.js Backend (Fastify)             │
│                                              │
│  ┌─ API Layer ────────────────────┐         │
│  │  ├─ REST routes (OpenAPI)      │         │
│  │  ├─ GraphQL resolvers          │         │
│  │  └─ WebSocket handlers         │         │
│  └────────┬──────────────────────┘         │
│           ▼                                  │
│  ┌─ Service Layer ────────────────┐         │
│  │  ├─ ChatService                │         │
│  │  ├─ VoiceService               │         │
│  │  ├─ RAGService                 │         │
│  │  └─ AuthService                │         │
│  └────────┬──────────────────────┘         │
│           ▼                                  │
│  ┌─ LLM Layer (LangChain) ────────┐         │
│  │  ├─ Chains (conversation)      │         │
│  │  ├─ Agents (code-expert)       │         │
│  │  ├─ RAG pipeline               │         │
│  │  └─ Prompt templates           │         │
│  └────────┬──────────────────────┘         │
│           ▼                                  │
│  ┌─ Observability ────────────────┐         │
│  │  ├─ OpenTelemetry traces       │         │
│  │  ├─ Langfuse logging           │         │
│  │  ├─ Prometheus metrics         │         │
│  │  └─ Pino logging               │         │
│  └────────┬──────────────────────┘         │
│           ▼                                  │
│  ┌─ Data Layer (Prisma) ──────────┐         │
│  │  ├─ PostgreSQL (conversations) │         │
│  │  ├─ Redis (caching)            │         │
│  │  └─ Vector DB (embeddings)     │         │
│  └────────────────────────────────┘         │
└──────────────────────────────────────────────┘
         │ (Traced & Monitored)
         ├─→ OpenAI API
         ├─→ PostgreSQL
         ├─→ Vector DB
         ├─→ Langfuse
         └─→ Prometheus
```

**Benefits:**
✅ Clean separation of concerns
✅ Abstraction layer (LangChain)
✅ Full observability & tracing
✅ Type safety (TypeScript)
✅ Production-ready
✅ Testable architecture
✅ Scalable (horizontal)
✅ AI evaluation pipeline

---

## 🎬 Quick Start (Phase 1)

### 1. Initialize monorepo
```bash
mkdir boltalka-ai-native && cd boltalka-ai-native
mkdir -p packages/backend packages/frontend packages/shared

# Backend
cd packages/backend
npm init -y
npm install fastify typescript ts-node @types/node

# Frontend
cd ../frontend
npm create next-app@latest .

# Workspace
cd ../..
npm init -y
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'packages/**'
EOF
```

### 2. Setup TypeScript
```bash
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "strict": true,
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
EOF
```

### 3. Docker setup
```bash
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: boltalka
    ports:
      - "5432:5432"
    
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
      
  backend:
    build: ./packages/backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/boltalka
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    depends_on:
      - postgres
      - redis
      
  frontend:
    build: ./packages/frontend
    ports:
      - "3001:3001"
EOF

# Start
docker-compose up
```

### 4. Create first backend service
```bash
# src/services/hello.service.ts
export class HelloService {
  async greet(name: string): Promise<string> {
    return `Hello, ${name}!`;
  }
}

# src/main.ts
import Fastify from 'fastify';
import { HelloService } from './services/hello.service';

const fastify = Fastify({ logger: true });
const helloService = new HelloService();

fastify.get('/api/hello/:name', async (request, reply) => {
  const { name } = request.params as { name: string };
  const greeting = await helloService.greet(name);
  return { message: greeting };
});

await fastify.listen({ port: 3000 });
```

---

## 📈 Success Metrics by Phase

| Phase | Metric | ✅ Success |
|------|---------|---------|
| 1 | Monorepo setup | `turbo run build` works |
| 2 | LLM Layer | LangChain chain logged in Langfuse |
| 3 | API Layer | GraphQL + REST endpoints live |
| 4 | Data Layer | PostgreSQL + Vector DB connected |
| 5 | Observability | Traces visible in Jaeger/Datadog |
| 6 | Frontend | React components work |
| 7 | Testing | 80%+ coverage achieved |
| 8 | Infrastructure | Docker build < 5min |
| 9 | Docs | Architecture doc complete |

---

## 🚨 Migrating Existing Data

```typescript
// scripts/migrate-conversations.ts
async function migrateConversations() {
  // 1. Read existing conversations (from cache/logs)
  const oldConversations = await readLegacyConversations();
  
  // 2. Transform format
  const transformed = oldConversations.map(conv => ({
    id: generateUUID(),
    userId: parseUserId(conv.sessionId),
    mode: detectMode(conv), // 'voice' or 'code_expert'
    messages: conv.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      tokensUsed: estimateTokens(msg.content),
      createdAt: new Date()
    })),
    createdAt: conv.startTime
  }));
  
  // 3. Bulk insert
  await prisma.conversation.createMany({ data: transformed });
  
  console.log(`✅ Migrated ${transformed.length} conversations`);
}

// Run once
await migrateConversations();
```

---

## 📚 Additional Information

Full plan is located in `/REFACTORING_PLAN.md` with:
- Detailed description of each phase
- Code examples for all components
- Dependencies for each layer
- Best practices and recommendations
- Timeboxing for each phase

Start with **Phase 1** - Setup infrastructure! 🚀
