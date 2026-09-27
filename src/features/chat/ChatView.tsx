import { useChatStore } from '@/stores/chatStore'
import { useChat } from '@/hooks/useChat'
import { MessageBubble } from './MessageBubble'
import { Button } from '@/components/ui/button'
import { ArrowDown } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

/** Pixels from the bottom still treated as "following" the stream. */
const NEAR_BOTTOM_PX = 80

function distanceFromBottom(el: HTMLElement): number {
  return el.scrollHeight - el.scrollTop - el.clientHeight
}

export function ChatView() {
  const chats = useChatStore((s) => s.chats)
  const activeChatId = useChatStore((s) => s.activeChatId)
  const isStreaming = useChatStore((s) => s.isStreaming)
  const streamingContent = useChatStore((s) => s.streamingContent)
  const error = useChatStore((s) => s.error)
  const { regenerate, editAndResend } = useChat()
  const scrollRef = useRef<HTMLDivElement>(null)
  const stickToBottomRef = useRef(true)
  const [showJumpToLatest, setShowJumpToLatest] = useState(false)

  const chat = chats.find((c) => c.id === activeChatId) ?? null

  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
  }, [])

  useEffect(() => {
    stickToBottomRef.current = true
    setShowJumpToLatest(false)
  }, [chat?.id])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const onScroll = () => {
      const near = distanceFromBottom(el) <= NEAR_BOTTOM_PX
      if (near !== stickToBottomRef.current) {
        stickToBottomRef.current = near
        setShowJumpToLatest(!near && useChatStore.getState().isStreaming)
      }
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [chat?.id])

  useEffect(() => {
    setShowJumpToLatest(!stickToBottomRef.current && isStreaming)
  }, [isStreaming])

  useEffect(() => {
    if (!stickToBottomRef.current) return
    scrollToBottom(isStreaming ? 'auto' : 'smooth')
  }, [chat?.messages, isStreaming, scrollToBottom, streamingContent])

  const jumpToLatest = () => {
    stickToBottomRef.current = true
    setShowJumpToLatest(false)
    scrollToBottom('smooth')
  }

  if (!chat) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Ollama Client</h1>
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
          Ask anything. Responses stream from your local Ollama instance.
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
          {chat.messages.map((message) => {
            const streamingThis =
              isStreaming &&
              message.role === 'assistant' &&
              message.id === lastAssistant?.id

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
