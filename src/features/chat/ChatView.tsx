import { useChatStore } from '@/stores/chatStore'
import { useChat } from '@/hooks/useChat'
import { MessageBubble } from './MessageBubble'
import { useEffect, useRef } from 'react'

export function ChatView() {
  const chats = useChatStore((s) => s.chats)
  const activeChatId = useChatStore((s) => s.activeChatId)
  const isStreaming = useChatStore((s) => s.isStreaming)
  const streamingContent = useChatStore((s) => s.streamingContent)
  const error = useChatStore((s) => s.error)
  const { regenerate, editAndResend } = useChat()
  const bottomRef = useRef<HTMLDivElement>(null)

  const chat = chats.find((c) => c.id === activeChatId) ?? null

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat?.messages, streamingContent, isStreaming])

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
    <div className="flex-1 overflow-y-auto">
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
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
