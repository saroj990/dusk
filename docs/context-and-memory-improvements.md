# Context & memory improvements

Ideas to improve **context** (what the model sees) and **memory** (browser RAM, IndexedDB, performance) for Dusk. Complements Phase 3 roadmap items (context management ticket, lazy chat load, attachments v2) and recent work (streaming persist, message collapse).

---

## Context (what the model sees)

### Already missing (highest impact)

- **Token/character budget** with a visible meter and warnings before send
- **Sliding window** (last N messages or last X estimated tokens)
- **Summarize older turns** into one block when over limit
- **Exclude** huge attachment text from old turns in the payload (keep in UI, omit from API unless pinned)

### Smarter assembly

- **Pin messages** so they always go to the provider even when trimming
- **System prompt + last user message** always kept; drop middle assistant fluff first
- **Deduplicate** repeated code blocks across turns (same snippet sent again on every follow-up)
- **Per-chat “context policy”**: creative (long history) vs precise (short window)

### Model-aware

- Read **context length** from Ollama model info / provider metadata when available; fallback heuristics
- **Warn** when images are attached but the active model likely isn’t vision-capable
- **Preflight** request size estimate including web-search snippets (they can be large)

### Workflow

- **“New chat with summary”** — one click to fork with a generated summary as the first message
- **Branch from message** (edit/regenerate already truncates; explicit “branch” keeps both threads)
- **Export context preview** — show exactly what will be sent before generate

### Not context, but feels like memory

- **Chat-level notes** (always injected, user-editable, small cap) — separate from system prompt
- **Project-level system prompt** (inherit in chats under a project)

---

## Memory (browser RAM, IndexedDB, performance)

### Already started / planned

- Lazy-load chats (metadata in sidebar, messages on demand)
- Attachments v2 (blobs vs base64, PDF text extraction)
- Collapse older messages + plain text while streaming (shipped)

### Storage shape

- Store **message bodies** separately from chat metadata (IndexedDB object stores)
- **Don’t hydrate all chats** at startup; keep an LRU of 1–2 full chats in RAM
- **Prune** redundant persistence paths during streaming (shipped: persist at end of stream)

### Attachments & images

- **Blob URLs** for display; **base64 only at send time** (or skip re-encoding stored blobs)
- **Thumbnail** for images in history; full resolution only when expanded or sent
- **Strip images from provider payload** on turns after the first vision turn if the user didn’t ask about the image again (optional toggle)

### Rendering

- **Virtualize** the message list for long threads (collapse helps; virtualization helps when everything is expanded)
- **Lazy Markdown**: render markdown only for messages in or near the viewport
- **Debounce** syntax highlight on visible messages only

### IndexedDB hygiene

- **Compaction** after delete (many edits/regenerates leave churn)
- **Export/delete old chats** bulk action to shrink DB
- Optional **archive** chats (hidden from sidebar, not loaded)

### Dev vs prod

- Document that **`npm run dev`** inflates memory; daily use **preview/build** or future **Tauri**

---

## Cross-cutting (context + memory)

| Idea | Helps context | Helps memory |
|------|----------------|--------------|
| Trim + keep full history in DB | Yes | Yes (smaller requests) |
| Lazy load + IDB search index | Search without full hydrate | Yes |
| Smaller attachment payloads in stored messages | Yes | Yes |
| Tauri + optional SQLite | Same logic, better large DB | Yes |
| “Compress this chat” user action | Yes | Slight |

---

## Suggested priority

1. **Context budget + sliding window + UI meter** — fixes real model failures
2. **Lazy chat load + blob attachments** — fixes tab RAM / IDB bloat
3. **Pinned messages + summarize-when-over** — power users, long threads
4. **Lazy markdown / virtualization** — long threads with everything expanded
5. **Project/chat notes** — small feature, big UX for “remember this”

None of this requires a Dusk backend. Tauri mainly helps **proxy, keychain, and SQLite**, not the core context math.

---

## Related GitHub issues (draft titles)

- Context window management for long chats (trim, estimate, summarize)
- Lazy-load chats from IndexedDB
- Attachments v2 and sidebar search v2
- Update README for current behavior
