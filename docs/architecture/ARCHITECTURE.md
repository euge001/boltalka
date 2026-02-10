# ARCHITECTURE DIAGRAM

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                    http://localhost:3005                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
          ▼                             ▼
    ┌──────────────┐           ┌──────────────┐
    │  /chat page  │           │ /coder page  │
    │  (Voice Bot) │           │ (Code Expert)│
    │   React      │           │   React      │
    │   Dark UI    │           │  Dark UI     │
    └──────┬───────┘           └──────┬───────┘
           │                          │
           │   HTTP Requests          │
           └──────────┬───────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │   BACKEND (Fastify)         │
        │   http://localhost:3002     │
        │   Node.js + TypeScript      │
        └──────────┬────────────────┬─┘
                   │                │
        ┌──────────▼─┐    ┌────────▼──────────┐
        │  Agent     │    │   LLM Chains      │
        │  Routes    │    │                   │
        │            │    │ - conversation    │
        │ /start     │    │ - code-expert     │
        │ /chat      │    └────────┬──────────┘
        │ /list      │             │
        └──────┬─────┘      ┌──────▼──────┐
               │            │             │
        ┌──────▼──────┐    │  LangChain  │
        │  LangGraph  │    │  + OpenAI   │
        │  Agents     │    │  GPT-4      │
        │             │    │             │
        │ - routing   │    └─────────────┘
        │ - state     │
        │ - tools     │
        └──────┬──────┘
               │
               ▼
        ┌──────────────────┐
        │   PostgreSQL     │
        │   (Prisma ORM)   │
        │                  │
        │ - conversations  │
        │ - messages       │
        │ - users (opt)    │
        │ - tokens (opt)   │
        └──────────────────┘
```

## Request Flow: Chat Message

```
User Types "Hello" in /chat
        │
        ▼
React Frontend
  - setInput("")
  - createUserMsg()
  - POST /api/agent/chat
        │
        ├─ conversationId
        ├─ message: "Hello"
        ├─ language: "en"
        └─ model: "gpt-4o-mini"
        │
        ▼
Fastify Backend (Port 3002)
  - registerAgentRoutes()
  - AgentExecutor.invoke()
        │
        ▼
LangGraph Nodes
  1. Route Node
     ├─ Check if code-related? NO
     └─ Route to LLM node
  2. LLM Node
     ├─ Call conversation chain
     ├─ Invoke OpenAI GPT-4
     ├─ Stream response
     └─ Return to frontend
  3. End Node
     └─ Save to PostgreSQL
        │
        ▼
Frontend Receives Response
  - createAssistantMsg()
  - Update state
  - Render in chat UI
        │
        ▼
User Sees AI Response
```

## Request Flow: Code Expert

```
User Types "How to write React?" in /coder
        │
        ▼
React Frontend
  - POST /api/llm/code-expert
        │
        ├─ prompt
        ├─ persona: "coding" | "architect" | "default"
        └─ mode: "auto" | "manual"
        │
        ▼
Fastify Backend
  - registerLLMRoutes()
  - LLMChainFactory.getCodeChain()
        │
        ▼
Code Expert Chain
  - GPT-4 with code instructions
  - Syntax highlighting
  - Return structured response
        │
        ▼
Frontend Receives
  - response + code block
  - Show in white chatbox
        │
        ▼
User Sees Formatted Code
```

## Database Schema (Simplified)

```sql
-- Conversations
CREATE TABLE conversations (
  id STRING PRIMARY KEY,
  user_id STRING,
  mode "auto" | "manual",
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  messages TEXT[] -- JSON array
);

-- Tokens (optional)
CREATE TABLE tokens (
  id STRING PRIMARY KEY,
  conversation_id STRING,
  input_tokens INT,
  output_tokens INT,
  model STRING,
  created_at TIMESTAMP
);
```

## File Structure (Key Files)

```
/var/www/html/Boltalka-Node/
├── start-all.sh                    ← Run this (ENV-based)
├── SESSION_STATUS.md               ← Full documentation (THIS FILE)
├── QUICK_REFERENCE.md              ← Quick commands
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── main.ts             ← Entry point
│   │   │   ├── api/
│   │   │   │   ├── health.ts       ← GET /health
│   │   │   │   └── rest/routes/
│   │   │   │       ├── agent.routes.ts    ← /api/agent/*
│   │   │   │       └── llm.routes.ts      ← /api/llm/*
│   │   │   ├── core/
│   │   │   │   ├── llm/
│   │   │   │   │   ├── index.ts                  ← Factory
│   │   │   │   │   ├── conversation-chain.ts
│   │   │   │   │   └── code-expert-chain.ts
│   │   │   │   ├── agent/
│   │   │   │   │   ├── index.ts                  ← Executor
│   │   │   │   │   ├── state.ts                  ← State def
│   │   │   │   │   ├── tools/
│   │   │   │   │   │   ├── llm-tool.ts
│   │   │   │   │   │   └── code-tool.ts
│   │   │   │   │   └── nodes/
│   │   │   │   │       ├── route.ts
│   │   │   │   │       ├── llm.ts
│   │   │   │   │       └── code-expert.ts
│   │   │   │   └── db/
│   │   │   │       ├── index.ts                  ← Prisma
│   │   │   │       └── schema.prisma
│   │   │   └── config/
│   │   │       ├── app.ts          ← loadConfig()
│   │   │       ├── fastify.ts      ← createApp()
│   │   │       ├── logger.ts       ← Pino
│   │   │       └── langfuse.ts     ← Observability
│   │   ├── .env                    ← PORT=3002, OpenAI keys
│   │   ├── dist/                   ← Compiled JS (run from here)
│   │   └── package.json
│   │
│   └── frontend/
│       ├── app/
│       │   ├── page.tsx                      ← Redirect → /chat
│       │   ├── layout.tsx                    ← Root layout
│       │   ├── globals.css                   ← Tailwind
│       │   ├── chat/
│       │   │   └── page.tsx                  ← Chat UI (React component)
│       │   ├── coder/
│       │   │   └── page.tsx                  ← Coder UI (React component)
│       │   ├── login/
│       │   │   └── page.tsx                  ← (not used)
│       │   └── register/
│       │       └── page.tsx                  ← (not used)
│       ├── .env.local               ← NEXT_PUBLIC_API_URL=http://localhost:3002
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.js
│       └── tailwind.config.ts
│
├── legacy/                         ← Original HTML/JS (reference only)
│   ├── index.html
│   └── coder.html
│
└── [Docker compose, tests, docs...]
```

## Component Dependencies

```
Frontend Components
├── /chat
│   ├── useState (messages, input, status)
│   ├── useEffect (init conversation)
│   ├── useRef (log element)
│   ├── Selectors (language, model, VAD)
│   ├── Display (dark theme)
│   └── API → /api/agent/*
│
└── /coder
    ├── useState (messages, input, persona)
    ├── useEffect (init)
    ├── useRef (log element)
    ├── Selectors (role, VAD)
    ├── Display (white chatbox for code)
    └── API → /api/llm/code-expert

Backend Execution Chain
├── Fastify Server
│   ├── registerAgentRoutes()
│   │   ├── POST /api/agent/start
│   │   │   └── AgentExecutor.invoke()
│   │   │       ├── LangGraph state machine
│   │   │       ├── Nodes (route, llm, code-expert)
│   │   │       └── Persist to PostgreSQL
│   │   └── POST /api/agent/chat
│   │       └── (same as above)
│   │
│   ├── registerLLMRoutes()
│   │   ├── POST /api/llm/conversation
│   │   │   └── ConversationChain.call()
│   │   └── POST /api/llm/code-expert
│   │       └── CodeExpertChain.call()
│   │
│   └── registerHealthCheck()
│       └── GET /health
│
└── PostgreSQL + Prisma
    └── Store/retrieve conversations
```

## Data Flow Example

```
User Input: "What is a closure?"

Frontend:
  - Detects user message
  - Calls POST /api/agent/chat
  - Sends: {
      conversationId: "conv-123",
      message: "What is a closure?",
      language: "en",
      model: "gpt-4o-mini"
    }

Backend - Agent Route Handler:
  - Receives request
  - Calls AgentExecutor.invoke(state)
  
Backend - LangGraph:
  - Route Node: "Is about code?" → YES
  - But NOT code-expert specific → Go to LLM
  - LLM Node: Call GPT-4 turbo
    Input: "What is a closure?"
    System: "You are helpful assistant"
    Response: "A closure is a function that..."
  - End Node: Save to DB
  
Backend Response:
  - Returns: {
      success: true,
      response: "A closure is a function that...",
      conversationId: "conv-123",
      state: {...}
    }

Frontend:
  - Receives response
  - Creates Assistant message
  - Updates UI
  - User sees answer ✅
```

---

## Deployment Checklist (If Needed)

- [ ] Set OPENAI_API_KEY in backend/.env
- [ ] Set DATABASE_URL for production DB
- [ ] npm run build in both packages
- [ ] Set NODE_ENV=production
- [ ] Configure proper CORS if external access needed
- [ ] Consider Langfuse integration for observability
- [ ] Add authentication layer (if required)
- [ ] Set up CDN for static assets
- [ ] Configure logging aggregation
- [ ] Set up monitoring/alerts

---

**Diagram Version:** 1.0  
**Generated:** 9 Feb 2026  
**Status:** CURRENT ✅
