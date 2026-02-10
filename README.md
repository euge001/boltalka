# Boltalka AI Native (v2.0.0)

AI-native voice interaction platform with real-time WebRTC connectivity.

## 🚀 Project Overview

This is a modern, monorepo-based rewrite of the Boltalka project. It features a Next.js frontend and a Fastify backend, utilizing OpenAI's Realtime API for multi-modal interactions.

## 📂 Structure

- **`packages/frontend`**: Next.js 14 application providing the user interface.
  - `/chat`: Standard voice bot with Auto (VAD) and Manual (Talk) modes.
  - `/coder`: Expert coding assistant mode.
- **`packages/backend`**: Fastify application handling API logic, WebRTC tokens, and workflows.
- **`packages/shared`**: Shared TypeScript types and utilities.
- **`docs/`**: Detailed project documentation and architecture guides.

## 🎤 Modes of Operation

### 1. Voice Bot (Classic Boltalka)
- **Auto (VAD)**: Semi-duplex conversation where AI detects speech end automatically.
- **Manual (Talk)**: Push-to-Talk logic for precise control.
- **Location**: `http://localhost:3005/chat`

### 2. Coder Expert
- Listen mode via microphone or System Audio (Line input).
- Text/Code output for technical assistance.
- **Location**: `http://localhost:3005/coder`

## 🛠 Tech Stack
- **Frameworks**: Next.js, Fastify
- **Orchestration**: Turbo, pnpm
- **Realtime**: OpenAI Realtime API (WebRTC)
- **Styling**: Tailwind CSS

## ⚙️ Running Locally

1. **Prerequisites**: Node.js, pnpm, Docker (optional).
2. **Installation**:
   ```bash
   pnpm install
   ```
3. **Environment**:
   Set `OPENAI_API_KEY` in `packages/backend/.env`.
4. **Development**:
   ```bash
   pnpm dev
   ```

## 📝 Cleanup & Maintenance
Legacy PHP and JS files have been removed or archived. The project follows a strictly typed TypeScript architecture in a monorepo structure.
