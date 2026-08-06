# Dusk

Lightweight, open-source AI chat client for local models — dark-first, fast, no backend.

Built with React 19, TypeScript, Vite, Tailwind CSS, and Zustand. No Docker, no Python runtime.

## Features

### Phase 1
- Provider abstraction + Ollama streaming chat
- IndexedDB local storage
- Settings, dark / light / system theme
- Markdown, code copy, regenerate, edit & resend

### Phase 2
- OpenAI-compatible providers (LM Studio, vLLM, OpenAI, etc.)
- Prompt library (save / insert)
- Model management (pull / delete for Ollama, favorites, recent)
- Projects (group chats)

### Phase 3 (build order)
1. **Search** (keyword) — done
2. **File attachments** — v1 (text + images, size limits)
3. **Desktop packaging** (Tauri)
4. **Plugin SDK**
5. **MCP support**

#### Attachment limits (v1)
- Max **5** files per message
- Text ≤ **256 KB** (truncated at 80k characters)
- Images ≤ **4 MB** (png/jpg/gif/webp)
- Stored on the message in **IndexedDB**; text is injected into the prompt; images sent for vision models

## Prerequisites

- Node.js 20+
- A running local provider, e.g. [Ollama](https://ollama.com)

```bash
ollama pull llama3.2
```

If the browser cannot reach Ollama:

```bash
OLLAMA_ORIGINS="http://localhost:5173,http://127.0.0.1:5173" ollama serve
```

For OpenAI-compatible servers, add them in **Settings → Providers** (base URL like `http://localhost:1234/v1`).

## Develop

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## Architecture

```
src/
 ├── app/           # App shell
 ├── components/    # Shared UI
 ├── features/      # Chat, models, prompts, settings
 ├── services/      # Providers + IndexedDB
 ├── stores/        # Zustand state
 ├── hooks/
 ├── plugins/       # Extension points (Phase 3)
 ├── utils/
└── types/
```
