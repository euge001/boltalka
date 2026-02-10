# Boltalka & Coder Expert Documentation

A comprehensive system for real-time voice interaction with AI using modern TypeScript stack.

## 🚀 Two Main Applications

1. **Voice Bot (/chat)**: Voice-to-voice. AI listens and responds with audio. Supports both automatic detection and manual triggers.
2. **Coder Expert (/coder)**: Focuses on technical solutions. Listens to input (Mic or System Audio) and outputs solutions as text/code.

## 🎤 Dialog Modes

### **Auto (VAD — Voice Activity Detection)**
- AI automatically detects the end of your speech.
- Best for natural conversation.

### **Manual (Push-to-Talk)**
- Press and hold **Talk** to record.
- Release to send and get response.
- Best for noisy environments or specific triggers.

## 📂 Project Structure (Modern)
- `packages/frontend/app/chat/` — Main voice interface.
- `packages/frontend/app/coder/` — Expert coding assistant.
- `packages/backend/src/` — API handlers and orchestrators.
- `packages/shared/` — Common types.

## 🧪 Testing
Run tests across the workspace:
```bash
pnpm test
```

## 📝 Modernization Changes (Feb 2026)
- ✅ Removal of legacy PHP codebase.
- ✅ Transition to Monorepo with `turbo` and `pnpm`.
- ✅ Unified `useWebRTC` hook for both interfaces.
- ✅ Support for multiple AI models and languages.
