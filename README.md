# Ollama Client

Lightweight, open-source AI chat client for local [Ollama](https://ollama.com) models.

Built with React 19, TypeScript, Vite, Tailwind CSS, and Zustand. No backend server, no Docker, no Python.

## Phase 1

- Project scaffold with feature-based architecture
- Provider abstraction (`AIProvider`)
- Ollama integration with streaming chat
- IndexedDB local storage for chats and settings
- Settings (theme, base URL, system prompt, temperature)
- Dark / light / system theme
- Responsive chat UI with markdown and code copy

## Prerequisites

- Node.js 20+
- [Ollama](https://ollama.com) running locally with at least one model pulled

```bash
ollama pull llama3.2
```

If the browser cannot reach Ollama, allow local origins:

```bash
OLLAMA_ORIGINS="http://localhost:5173,http://127.0.0.1:5173" ollama serve
```

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

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Typecheck and production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |

## Architecture

```
src/
 ├── app/           # App shell
 ├── components/    # Shared UI (shadcn-style)
 ├── features/      # Chat, models, settings
 ├── services/      # Providers + IndexedDB
 ├── stores/        # Zustand state
 ├── hooks/
 ├── plugins/       # Extension points (Phase 3)
├── utils/
└── types/
```
