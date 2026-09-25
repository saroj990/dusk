import { useChatStore } from '@/stores/chatStore'
import { useChat } from '@/hooks/useChat'
import { MessageBubble } from './MessageBubble'
import {
  MESSAGE_COLLAPSE_THRESHOLD,
  MESSAGE_FULL_RENDER_RECENT,
  MESSAGE_KEEP_RECENT,
} from './messageCollapse'
import { Button } from '@/components/ui/button'
import { useEffect, useMemo, useRef, useState } from 'react'

export function ChatView() {
  const chats = useChatStore((s) => s.chats)
  const activeChatId = useChatStore((s) => s.activeChatId)
  const focusedMessageId = useChatStore((s) => s.focusedMessageId)
  const clearFocusedMessage = useChatStore((s) => s.clearFocusedMessage)
  const isStreaming = useChatStore((s) => s.isStreaming)
  const streamingContent = useChatStore((s) => s.streamingContent)
  const error = useChatStore((s) => s.error)
  const { regenerate, editAndResend } = useChat()
  const bottomRef = useRef<HTMLDivElement>(null)
  const [showEarlierMessages, setShowEarlierMessages] = useState(false)

  const chat = chats.find((c) => c.id === activeChatId) ?? null

  useEffect(() => {
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
    if (focusedMessageId) return
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [visibleMessageKey, streamingContent, isStreaming, focusedMessageId])

  useEffect(() => {
    if (!focusedMessageId) return
    const el = document.getElementById(`message-${focusedMessageId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    const timer = window.setTimeout(() => clearFocusedMessage(), 2500)
    return () => window.clearTimeout(timer)
  }, [focusedMessageId, chat?.id, clearFocusedMessage, showEarlierMessages])

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
    <div className="flex-1 overflow-y-auto">
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
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
