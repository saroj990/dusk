import type { Message, ProviderMessage } from '@/types'
import { messageToProviderMessage } from './attachments'

/** Max chat turns sent to the provider (user + assistant messages). */
export const MAX_CONTEXT_MESSAGES = 40

/** Total cap for web-search block injected into the latest user turn. */
export const MAX_WEB_SEARCH_PROMPT_CHARS = 6_000

/** Per-message cap for attached text inlined into the provider payload. */
export const MAX_ATTACHMENT_TEXT_IN_PROMPT = 24_000

/**
 * Trim history and shrink payloads so prefill stays fast.
 * UI/storage still keep full messages; only the API request is trimmed.
 */
export function buildProviderMessages(history: Message[]): ProviderMessage[] {
  const trimmed = history.slice(-MAX_CONTEXT_MESSAGES)
  const lastUserId = [...trimmed].reverse().find((m) => m.role === 'user')?.id

  return trimmed.map((message) => {
    const isLatestUser = message.id === lastUserId
    return messageToProviderMessage(message, {
      includeWebSearch: isLatestUser,
      includeAttachments: isLatestUser,
      maxAttachmentChars: MAX_ATTACHMENT_TEXT_IN_PROMPT,
      maxWebSearchChars: MAX_WEB_SEARCH_PROMPT_CHARS,
    })
  })
}
