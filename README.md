# Boltalka & Coder Expert

A comprehensive system for real-time voice interaction with AI.

## 🚀 Two Modes

1. **Classic Boltalka (`index.html`)**: Voice-to-voice. AI listens and responds with audio. Perfect for casual conversation.
2. **Coder Expert (`coder.html`)**: Silent mode. AI listens and outputs solutions as text/code in chat. Uses `gpt-4o-mini-realtime` for transcription and `gpt-4o` for solution generation.

## 🎤 Dialog Modes in Boltalka

### **Auto (VAD — Voice Activity Detection)**
- AI automatically detects the end of your speech (server-side VAD)
- Responds immediately after you finish speaking
- **Use when**: Natural conversation, hands-free interaction

### **Manual (Push-to-Talk)**
- You control when to send audio
- Press **Talk** → microphone active (`🔴 Recording...`)
- Speak your phrase
- Press **Talk** again → audio sent, AI responds
- **Use when**: Noisy environments, precise control needed

**Important**: The **Talk** button works ONLY in Manual mode and when connected.

## 🛠 Tech Stack
- **Frontend**: HTML5, WebRTC, Bootstrap 5, Marked.js (Markdown)
- **Backend**: PHP (Litespeed/Apache/Nginx)
- **API**: OpenAI Realtime API (GA) & Chat Completions API

## ⚙️ Configuration

### 1. API Keys
File `.env` in root. Contains `OPENAI_API_KEY`.

### 2. Models & Roles
- **Transcription**: Set in `token.php` and `app.js`/`coder.js` (instructions)
- **Expert Logic**: Configured in `chat.php` with system prompts and model selection

### 3. Session Settings
In `app.js` and `coder.js`, `connect()` → `session.update`:
- `instructions`: Global behavior rules for the model
- `turn_detection`: VAD settings (Auto mode only)

### 4. Model & Language Switching (NEW)
Use the `ConfigService` (see `configService.js`):
```javascript
const config = await ConfigService.getConfig();
await ConfigService.setModel('gpt-4o-mini-realtime-preview');
await ConfigService.setLanguage('en');
await ConfigService.setInstructions('Your custom prompt...');
```

## 🧪 Testing
```bash
# Backend tests
php test_backend.php

# API key validation
python3 api_check.py

# Run all tests
npm test
```

## 📂 Project Structure
- `app.js` / `index.html` — Main voice chat with Auto/Manual modes
- `coder.js` / `coder.html` — Silent expert mode
- `configService.js` — Reusable model/language switching service
- `chat.php` — Backend proxy for heavy models
- `token.php` — Secure temporary key generation for WebRTC
- `config.php` — Central configuration
- `config_js.php` — Config export for JavaScript
- `tests/` — Comprehensive test suite

## 📝 Changelog

### v9.x (Feb 2026)
- ✅ Complete English translation (UI + docs)
- ✅ ConfigService for model/language switching
- ✅ 100% test coverage with automated test suite
- ✅ On-the-fly mode switching

### v8.x
- ✅ Auto & Manual modes
- ✅ Talk button (Manual only, when connected)
- ✅ Enhanced logging


