import { useChatStore } from '@/stores/chatStore'
import { useChat } from '@/hooks/useChat'
import { MessageBubble } from './MessageBubble'
import {
  MESSAGE_COLLAPSE_THRESHOLD,
  MESSAGE_FULL_RENDER_RECENT,
  MESSAGE_KEEP_RECENT,
} from './messageCollapse'
import { Button } from '@/components/ui/button'
import { ArrowDown } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

/** Pixels from the bottom still treated as "following" the stream. */
const NEAR_BOTTOM_PX = 80

function distanceFromBottom(el: HTMLElement): number {
  return el.scrollHeight - el.scrollTop - el.clientHeight
}

export function ChatView() {
  const chats = useChatStore((s) => s.chats)
  const activeChatId = useChatStore((s) => s.activeChatId)
  const focusedMessageId = useChatStore((s) => s.focusedMessageId)
  const clearFocusedMessage = useChatStore((s) => s.clearFocusedMessage)
  const isStreaming = useChatStore((s) => s.isStreaming)
  const streamingContent = useChatStore((s) => s.streamingContent)
  const error = useChatStore((s) => s.error)
  const { regenerate, editAndResend } = useChat()
  const scrollRef = useRef<HTMLDivElement>(null)
  const stickToBottomRef = useRef(true)
  /** Skip scroll listener while we programmatically scroll (avoids stick / jump UI thrash). */
  const programmaticScrollRef = useRef(false)
  const [showJumpToLatest, setShowJumpToLatest] = useState(false)
  const [showEarlierMessages, setShowEarlierMessages] = useState(false)

  const chat = chats.find((c) => c.id === activeChatId) ?? null

  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    const el = scrollRef.current
    if (!el) return
    programmaticScrollRef.current = true
    el.scrollTo({ top: el.scrollHeight, behavior })
    requestAnimationFrame(() => {
      programmaticScrollRef.current = false
    })
  }, [])

  const updateJumpToLatest = useCallback((nearBottom: boolean) => {
    const streaming = useChatStore.getState().isStreaming
    const next = !nearBottom && streaming
    setShowJumpToLatest((prev) => (prev === next ? prev : next))
  }, [])

  useEffect(() => {
    stickToBottomRef.current = true
    setShowJumpToLatest(false)
    setShowEarlierMessages(false)
  }, [chat?.id])

  const collapseEarlier = Boolean(
    chat && chat.messages.length > MESSAGE_COLLAPSE_THRESHOLD && !showEarlierMessages,
  )
  const hiddenEarlierCount =
    chat && collapseEarlier ? chat.messages.length - MESSAGE_KEEP_RECENT : 0

  const messageCount = chat?.messages.length ?? 0
  const messages = chat?.messages

  const visibleMessages = useMemo(() => {
    if (!messages) return []
    if (!collapseEarlier) return messages
    return messages.slice(-MESSAGE_KEEP_RECENT)
  }, [messages, collapseEarlier])

  const visibleMessageKey = useMemo(
    () => visibleMessages.map((m) => m.id).join(','),
    [visibleMessages],
  )

  useEffect(() => {
    if (!focusedMessageId || !activeChatId) return
    const current = useChatStore.getState().chats.find((c) => c.id === activeChatId)
    if (!current || current.messages.length <= MESSAGE_COLLAPSE_THRESHOLD) return
    const idx = current.messages.findIndex((m) => m.id === focusedMessageId)
    if (idx < 0 || idx >= current.messages.length - MESSAGE_KEEP_RECENT) return
    setShowEarlierMessages(true)
  }, [focusedMessageId, activeChatId, messageCount])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const onScroll = () => {
      if (programmaticScrollRef.current) return
      const near = distanceFromBottom(el) <= NEAR_BOTTOM_PX
      if (near === stickToBottomRef.current) return
      stickToBottomRef.current = near
      updateJumpToLatest(near)
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [chat?.id, updateJumpToLatest])

  useLayoutEffect(() => {
    if (focusedMessageId) return
    if (!stickToBottomRef.current) return
    scrollToBottom('auto')
  }, [focusedMessageId, visibleMessageKey, streamingContent, scrollToBottom])

  useEffect(() => {
    if (!isStreaming) {
      setShowJumpToLatest((prev) => (prev ? false : prev))
      return
    }
    if (!stickToBottomRef.current) {
      setShowJumpToLatest((prev) => (prev ? prev : true))
    }
  }, [isStreaming])

  useEffect(() => {
    if (!focusedMessageId) return
    stickToBottomRef.current = false
    setShowJumpToLatest(false)
    const el = document.getElementById(`message-${focusedMessageId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    const timer = window.setTimeout(() => clearFocusedMessage(), 2500)
    return () => window.clearTimeout(timer)
  }, [
    focusedMessageId,
    chat?.id,
    clearFocusedMessage,
    showEarlierMessages,
  ])

  const jumpToLatest = () => {
    stickToBottomRef.current = true
    setShowJumpToLatest(false)
    scrollToBottom('smooth')
  }

  if (!chat) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Dusk</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          A lightweight local AI chat client. Select a model and start a conversation.
        </p>
      </div>
    )
  }

  if (chat.messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <h2 className="text-xl font-semibold tracking-tight">New chat</h2>
        <p className="text-sm text-muted-foreground">
          Ask anything. Responses stream from your local provider.
        </p>
        {error && (
          <p className="mt-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    )
  }

  const lastAssistant = [...chat.messages].reverse().find((m) => m.role === 'assistant')

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl">
          {hiddenEarlierCount > 0 && (
            <div className="border-b border-border px-4 py-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => setShowEarlierMessages(true)}
              >
                Show {hiddenEarlierCount} earlier message
                {hiddenEarlierCount === 1 ? '' : 's'}
              </Button>
            </div>
          )}

          {visibleMessages.map((message, index) => {
            const streamingThis =
              isStreaming &&
              message.role === 'assistant' &&
              message.id === lastAssistant?.id

            const startCompact =
              !streamingThis &&
              visibleMessages.length - index > MESSAGE_FULL_RENDER_RECENT

            return (
              <MessageBubble
                key={message.id}
                message={{
                  ...message,
                  content:
                    streamingThis && streamingContent
                      ? streamingContent
                      : message.content,
                }}
                isStreaming={streamingThis}
                highlighted={focusedMessageId === message.id}
                startCompact={startCompact}
                onRegenerate={
                  message.role === 'assistant'
                    ? () => regenerate(message.id)
                    : undefined
                }
                onEdit={
                  message.role === 'user'
                    ? (content) => editAndResend(message.id, content)
                    : undefined
                }
              />
            )
          })}
          {error && (
            <div className="px-4 py-3">
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            </div>
          )}
          <div aria-hidden className="h-1" />
        </div>
      </div>

      {showJumpToLatest && (
        <div className="pointer-events-none absolute bottom-3 left-0 right-0 flex justify-center">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="pointer-events-auto gap-1.5 shadow-md"
            onClick={jumpToLatest}
          >
            <ArrowDown className="h-4 w-4" />
            Jump to latest
          </Button>
        </div>
      )}
    </div>
  )
}
