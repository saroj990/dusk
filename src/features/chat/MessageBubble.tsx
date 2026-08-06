import { useEffect, useState } from 'react'
import {
  Check,
  Copy,
  FileText,
  ImageIcon,
  Pencil,
  RefreshCw,
  User,
  Bot,
} from 'lucide-react'
import type { Message } from '@/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Markdown } from './Markdown'
import { cn, formatBytes } from '@/utils/cn'

interface MessageBubbleProps {
  message: Message
  isStreaming?: boolean
  highlighted?: boolean
  onRegenerate?: () => void
  onEdit?: (content: string) => void
}

export function MessageBubble({
  message,
  isStreaming,
  highlighted,
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
      id={`message-${message.id}`}
      data-message-id={message.id}
      className={cn(
        'group flex gap-3 px-4 py-5 transition-colors',
        isUser ? 'bg-transparent' : 'bg-muted/30',
        highlighted && 'bg-primary/10 ring-1 ring-inset ring-primary/30',
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
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {message.attachments.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-background/60 px-2 py-1 text-xs"
                  >
                    {file.kind === 'image' ? (
                      <ImageIcon className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span className="truncate max-w-[180px]">{file.name}</span>
                    <span className="text-muted-foreground">
                      {formatBytes(file.size)}
                    </span>
                    {file.kind === 'image' && file.base64 && (
                      <img
                        src={`data:${file.mimeType};base64,${file.base64}`}
                        alt={file.name}
                        className="ml-1 h-10 w-10 rounded object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {isUser ? (
              message.content ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </p>
              ) : null
            ) : message.content ? (
              <Markdown content={message.content} />
            ) : null}

            {isStreaming && (
              <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-foreground/70 align-middle" />
            )}
          </>
        )}

        {!editing &&
          !isStreaming &&
          (message.content || (message.attachments?.length ?? 0) > 0) && (
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            {message.content && (
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={copy}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                Copy
              </Button>
            )}
            {isUser && onEdit && message.content && (
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
