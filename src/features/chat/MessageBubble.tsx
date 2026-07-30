import { useEffect, useState } from 'react'
import {
  Check,
  Copy,
  Pencil,
  RefreshCw,
  User,
  Bot,
} from 'lucide-react'
import type { Message } from '@/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Markdown } from './Markdown'
import { cn } from '@/utils/cn'

interface MessageBubbleProps {
  message: Message
  isStreaming?: boolean
  onRegenerate?: () => void
  onEdit?: (content: string) => void
}

export function MessageBubble({
  message,
  isStreaming,
  onRegenerate,
  onEdit,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(message.content)
  const isUser = message.role === 'user'

  useEffect(() => {
    setDraft(message.content)
  }, [message.content])

  const copy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div
      className={cn(
        'group flex gap-3 px-4 py-5',
        isUser ? 'bg-transparent' : 'bg-muted/30',
      )}
    >
      <div
        className={cn(
          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground',
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="text-xs font-medium text-muted-foreground">
          {isUser ? 'You' : 'Assistant'}
        </div>

        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="min-h-[100px]"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  onEdit?.(draft)
                  setEditing(false)
                }}
              >
                Save & regenerate
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDraft(message.content)
                  setEditing(false)
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            {isUser ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
              </p>
            ) : message.content ? (
              <Markdown content={message.content} />
            ) : null}

            {isStreaming && (
              <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-foreground/70 align-middle" />
            )}
          </>
        )}

        {!editing && !isStreaming && message.content && (
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={copy}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              Copy
            </Button>
            {isUser && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
            {!isUser && onRegenerate && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={onRegenerate}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
