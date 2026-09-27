/** When a chat exceeds this length, older messages stay out of the DOM until expanded. */
export const MESSAGE_COLLAPSE_THRESHOLD = 8

/** How many trailing messages to render when earlier messages are collapsed. */
export const MESSAGE_KEEP_RECENT = 6

/** Among visible messages, only the last N render full markdown by default. */
export const MESSAGE_FULL_RENDER_RECENT = 4

export function previewMessageText(content: string, maxLen = 160): string {
  const oneLine = content.replace(/\s+/g, ' ').trim()
  if (oneLine.length <= maxLen) return oneLine
  return `${oneLine.slice(0, maxLen)}…`
}
