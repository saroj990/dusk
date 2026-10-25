import type { Message, ProviderMessage } from '@/types'
import { messageToProviderMessage } from './attachments'

/** Upper bound for the settings slider / input. */
export const MAX_CONTEXT_MESSAGES_CAP = 80

/** Total cap for web-search block injected into the latest user turn. */
export const MAX_WEB_SEARCH_PROMPT_CHARS = 6_000

/** Per-message cap for attached text inlined into the provider payload. */
export const MAX_ATTACHMENT_TEXT_IN_PROMPT = 24_000

/**
 * Trim history and shrink payloads so prefill stays fast.
 * UI/storage still keep full messages; only the API request is trimmed.
 */
export function buildProviderMessages(
  history: Message[],
  contextMessageLimit: number,
): ProviderMessage[] {
  const limit = Math.max(2, Math.min(contextMessageLimit, MAX_CONTEXT_MESSAGES_CAP))
  const trimmed = history.slice(-limit)
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
