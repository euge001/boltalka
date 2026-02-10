# Project Development Roadmap

**Goal:** Split project into voice chat (Boltalka) and expert system for coding (Coder Expert).

## Module 1: Coder Expert (Current Task)
**How it works:** AI only listens and instantly outputs solution in chat without voice.

- [x] **Real-time transcription:** Stream speech through `gpt-4o-realtime-preview` (maximum speed, minimum cost).
- [x] **Send to expert model:** Automatically send recognized text to `/api/llm/code-expert` (GPT-4o model).
- [x] **Text output:** Expert response displayed in chat as text and code with explanations.
- [x] **No voice:** Expert does not generate audio responses.
- [x] **Markdown support:** Code and text formatting in chat.

## Next Steps (on request):
1. **Stack customization:** Allow passing user's current tech stack to expert on-the-fly.
2. **Delay control:** Optimize text transfer between models to reduce response time.
3. **Chat history:** Save expert solutions in interface.

## Module 2: Classic Boltalka
- [x] **Voice-to-voice:** Kept as separate functionality (`/chat`). Used for regular conversation.
