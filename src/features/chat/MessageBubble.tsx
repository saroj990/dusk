import { useEffect, useState } from 'react'
import {
  Check,
  Copy,
  FileText,
  ImageIcon,
  Pencil,
  RefreshCw,
  Timer,
  User,
  Bot,
} from 'lucide-react'
import type { Message } from '@/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Markdown } from './Markdown'
import { previewMessageText } from './messageCollapse'
import { WebSearchSources } from './WebSearchSources'
import { cn, formatBytes, formatGenerationDuration } from '@/utils/cn'

interface MessageBubbleProps {
  message: Message
  isStreaming?: boolean
  highlighted?: boolean
  /** When true, show a one-line preview until the user expands (saves DOM / highlight cost). */
  startCompact?: boolean
  onRegenerate?: () => void
  onEdit?: (content: string) => void
}

export function MessageBubble({
  message,
  isStreaming,
  highlighted,
  startCompact = false,
  onRegenerate,
  onEdit,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(message.content)
  /** User opted in to full render for a compact-eligible message. */
  const [userExpanded, setUserExpanded] = useState(false)
  const isUser = message.role === 'user'
  const compact =
    startCompact &&
    !userExpanded &&
    !highlighted &&
    !isStreaming &&
    !editing

  useEffect(() => {
    if (!editing) return
    setDraft(message.content)
  }, [message.content, editing])

  useEffect(() => {
    setUserExpanded(false)
  }, [message.id])

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

        {compact ? (
          <div className="space-y-2 rounded-lg border border-border/80 bg-background/40 px-3 py-2">
            <p className="text-sm text-muted-foreground">
              {previewMessageText(message.content || message.attachments?.[0]?.name || 'Message')}
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-7"
              onClick={() => setUserExpanded(true)}
            >
              Show full message
            </Button>
          </div>
        ) : editing ? (
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
            ) : isStreaming ? (
              message.content ? (
                <pre className="assistant-content whitespace-pre-wrap overflow-x-auto">
                  {message.content}
                </pre>
              ) : (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
                  Generating…
                </p>
              )
            ) : message.content ? (
              <Markdown content={message.content} />
            ) : null}

            {message.webSearch && message.webSearch.length > 0 && (
              <WebSearchSources hits={message.webSearch} className="mt-1" />
            )}

            {isStreaming && message.content && (
              <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-foreground/70 align-middle" />
            )}
          </>
        )}

        {!editing &&
          !isStreaming &&
          !compact &&
          (message.content || (message.attachments?.length ?? 0) > 0) && (
          <div className="flex flex-wrap items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
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
                onClick={() => {
                  setDraft(message.content)
                  setEditing(true)
                }}
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
            {!isUser && message.generationMs != null && (
              <span
                className="flex h-7 items-center gap-1 px-2 text-xs text-muted-foreground"
                title={
                  message.ttftMs != null
                    ? `${formatGenerationDuration(message.ttftMs)} to first token · ${formatGenerationDuration(message.generationMs)} total`
                    : `${formatGenerationDuration(message.generationMs)} total`
                }
              >
                <Timer className="h-3.5 w-3.5 shrink-0 opacity-70" />
                {message.ttftMs != null ? (
                  <>
                    {formatGenerationDuration(message.ttftMs)}
                    <span className="opacity-50">·</span>
                    {formatGenerationDuration(message.generationMs)}
                  </>
                ) : (
                  formatGenerationDuration(message.generationMs)
                )}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
