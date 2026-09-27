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
- Projects (group chats; move existing chats into a project)

### Phase 3 (build order)
1. **Search** (keyword) — done
2. **File attachments** — v1 (text + images, size limits)
3. **Desktop packaging** (Tauri)
4. **Plugin SDK**
5. **MCP support**

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

---

## Architecture (high level)

Dusk is a **local-first** React app. There is no application backend. The browser:

1. Saves chats / settings / prompts / projects in **IndexedDB**
2. Talks directly to **Ollama** or an **OpenAI-compatible** API
3. Builds **context** on every request and sends it to the model

```
main.tsx → App (shell)
              ↓
     Zustand stores ←→ IndexedDB (services/storage.ts)
              ↓
     features/* UI  →  useChat  →  providers (Ollama / OpenAI)
```

**One-liner:** `App` composes UI → stores hold state → `storage` persists → `useChat` builds context → `providers` talk to the LLM.

### Source layout

```
src/
├── main.tsx              # React mount
├── index.css             # Tailwind + theme tokens + markdown
├── app/App.tsx           # Boot, layout, dialogs
├── types/                # Shared domain types
├── services/
│   ├── storage.ts        # IndexedDB (chats, settings, prompts, projects)
│   └── providers/
│       ├── types.ts      # AIProvider interface
│       ├── registry.ts   # Resolve active provider from settings
│       ├── ollama.ts     # Ollama streaming + pull/delete
│       └── openai.ts     # OpenAI-compatible streaming
├── stores/               # Zustand (RAM + persist via storage)
│   ├── chatStore.ts
│   ├── settingsStore.ts
│   ├── modelStore.ts
│   ├── promptStore.ts
│   └── projectStore.ts
├── hooks/
│   ├── useChat.ts        # Send / stream / stop / regenerate / edit
│   └── useTheme.ts       # Apply light/dark/system to <html>
├── features/
│   ├── chat/             # Sidebar, ChatView, ChatInput, search, attachments, markdown
│   ├── models/           # Model selector + manager
│   ├── prompts/          # Prompt library dialog
│   └── settings/         # Settings dialog
├── components/ui/        # Shared primitives (button, dialog, select, …)
├── utils/                # cn, ids, formatters
└── plugins/              # Stub for future plugin SDK
```

### Layer responsibilities

| Layer | Role |
| --- | --- |
| `app/App.tsx` | Hydrate stores, refresh models, compose shell UI |
| `features/*` | Product UI (chat, models, prompts, settings) |
| `stores/*` | In-memory state; call `storage` to persist |
| `services/storage.ts` | IndexedDB read/write |
| `services/providers/*` | HTTP to LLM APIs (streaming) |
| `hooks/useChat.ts` | Orchestrate send → history → stream → update UI |

UI code rarely talks to IndexedDB or fetch APIs directly; it goes through stores / hooks / providers.

---

## How a chat request works

```
ChatInput send(text, attachments)
  → useChat.append user message (+ attachments) → IndexedDB
  → append empty assistant message
  → map full chat history → provider messages (context)
  → provider.chat() streams chunks
  → update assistant message as tokens arrive
  → ChatView re-renders
```

### Context model

LLMs used via chat APIs are **stateless per request**. They do not remember your app’s history unless you send it again.

On every generation Dusk:

1. Loads the **active chat’s messages** from Zustand
2. Optionally prepends the Settings **system prompt**
3. Folds **text attachments** into message `content`
4. Attaches **images** on messages that have them
5. Optionally runs **web search** and injects snippets + URLs
6. `POST`s that full `messages` array to the provider

So: **the frontend builds and sends context every time.** Old attachments stay on their original messages and are resent on later turns in that chat.

There is currently **no** context-window trimming, summarization, or cross-chat memory.

### Attachments (v1)

| Limit | Value |
| --- | --- |
| Files per message | 5 |
| Text | ≤ 256 KB (content capped at 80k characters) |
| Images | ≤ 4 MB (png / jpg / gif / webp) |

**Pipeline**

1. User picks or drops files in the composer
2. Client validates type/size and reads the file (`features/chat/attachments.ts`)
3. Text → store extracted string; image → store base64 on the message
4. Persist with the user message in IndexedDB
5. On send: text injected into the prompt; images sent for vision models (e.g. `llava`)

Document parsing is **client-side**. The model only receives prepared text / image payloads — not raw PDF/binary formats (PDF not supported in v1).

### Web search (optional)

**No Dusk backend.** The browser fetches sources, then the app injects snippets into the LLM request.

| Source | Backend? | Notes |
| --- | --- | --- |
| DuckDuckGo (default) | No | No API key; Vite **dev proxy** (restart `npm run dev`) |
| Wikipedia | No | CORS-friendly; encyclopedia, not live news |
| Brave Search | No Dusk server | Needs your API key; Vite **dev proxy** avoids browser CORS |

Usage: click the **globe** on a message before send. Sources show on the user bubble and are stored with the chat.

### Search

- Sidebar keyword search over **in-memory** chats (titles + message bodies)
- Case-insensitive substring match, capped results
- Click a hit → open chat and scroll/highlight the matching message
- Does not query IndexedDB separately (relies on hydrated Zustand state)

### Projects

- Sidebar folders group chats via `chat.projectId`
- New chats join the **active** project
- Existing chats: hover → **Move to project**

### Prompt library

- Saved text snippets in IndexedDB
- **Insert** pastes into the composer (not the same as the always-on system prompt in Settings)

---

## Providers

```
settings.activeProviderId
  → getActiveProviderConfig()
  → getProvider(config)   // registry
  → OllamaProvider | OpenAICompatibleProvider
  → async iterable ChatChunk stream
```

| Provider | Endpoints (typical) |
| --- | --- |
| Ollama | `GET /api/tags`, `POST /api/chat` (NDJSON stream), pull/delete |
| OpenAI-compatible | `GET /v1/models`, `POST /v1/chat/completions` (SSE) |

The UI selects provider + model in the header; `useChat` always uses the active provider from settings.

---

## Storage

| Data | Where |
| --- | --- |
| Chats + messages (+ attachments) | IndexedDB `chats` |
| Settings / providers / favorites | IndexedDB `settings` |
| Prompt library | IndexedDB `prompts` |
| Projects | IndexedDB `projects` |
| Model weights | **Not stored** — managed by Ollama / the remote API |

Database name: `ollama-client` (browser origin–scoped). Clearing site data wipes local history.

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

---

## Design principles

1. **Performance** — keep the core thin; avoid unnecessary deps  
2. **Simplicity** — no app backend; feature-based folders  
3. **Maintainability** — provider interface so UI stays provider-agnostic  
4. **Extensibility** — plugin/MCP hooks planned later; load on demand  

When in doubt: the application owns memory and context; the LLM only sees what you send in each request.
