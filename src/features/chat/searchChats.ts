import type { Chat, Role } from '@/types'
import { truncate } from '@/utils/cn'

export interface SearchHit {
  chatId: string
  chatTitle: string
  messageId: string | null
  role: Role | 'title'
  snippet: string
}

const MAX_HITS = 40

function snippetAround(text: string, query: string, radius = 48): string {
  const lower = text.toLowerCase()
  const idx = lower.indexOf(query)
  if (idx < 0) return truncate(text, radius * 2)
  const start = Math.max(0, idx - radius)
  const end = Math.min(text.length, idx + query.length + radius)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < text.length ? '…' : ''
  return `${prefix}${text.slice(start, end).trim()}${suffix}`
}

/** Case-insensitive keyword search over chat titles and message bodies. */
export function searchChats(chats: Chat[], rawQuery: string): SearchHit[] {
  const query = rawQuery.trim().toLowerCase()
  if (!query) return []

  const hits: SearchHit[] = []

  for (const chat of chats) {
    if (hits.length >= MAX_HITS) break

    if (chat.title.toLowerCase().includes(query)) {
      hits.push({
        chatId: chat.id,
        chatTitle: chat.title,
        messageId: null,
        role: 'title',
        snippet: chat.title,
      })
      if (hits.length >= MAX_HITS) break
    }

    for (const message of chat.messages) {
      if (hits.length >= MAX_HITS) break
      if (!message.content.toLowerCase().includes(query)) continue
      hits.push({
        chatId: chat.id,
        chatTitle: chat.title,
        messageId: message.id,
        role: message.role,
        snippet: snippetAround(message.content, query),
      })
    }
  }

  return hits
}
