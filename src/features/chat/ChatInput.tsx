import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { ArrowUp, FileText, ImageIcon, Paperclip, Square, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ATTACHMENT_CONSTRAINTS,
  describeAttachmentLimits,
  filesToAttachments,
} from '@/features/chat/attachments'
import { cn, formatBytes } from '@/utils/cn'
import type { Attachment } from '@/types'

export interface InsertRequest {
  id: number
  text: string
}

interface ChatInputProps {
  onSend: (content: string, attachments: Attachment[]) => void
  onStop: () => void
  isStreaming: boolean
  disabled?: boolean
  placeholder?: string
  insertRequest?: InsertRequest | null
}

export function ChatInput({
  onSend,
  onStop,
  isStreaming,
  disabled,
  placeholder = 'Message…',
  insertRequest,
}: ChatInputProps) {
  const [value, setValue] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [attachError, setAttachError] = useState<string | null>(null)
  const [reading, setReading] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [value])

  useEffect(() => {
    if (!insertRequest) return
    setValue((prev) => {
      if (!prev.trim()) return insertRequest.text
      return `${prev.replace(/\s+$/, '')}\n\n${insertRequest.text}`
    })
    window.setTimeout(() => ref.current?.focus(), 0)
  }, [insertRequest])

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setReading(true)
    setAttachError(null)
    try {
      const { attachments: next, errors } = await filesToAttachments(
        files,
        attachments.length,
      )
      if (next.length) {
        setAttachments((prev) => [...prev, ...next])
      }
      if (errors.length) {
        setAttachError(errors.join(' '))
      }
    } finally {
      setReading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const submit = () => {
    if ((!value.trim() && attachments.length === 0) || isStreaming || disabled) {
      return
    }
    onSend(value, attachments)
    setValue('')
    setAttachments([])
    setAttachError(null)
    if (ref.current) {
      ref.current.style.height = 'auto'
    }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="border-t border-border bg-background/80 p-3 backdrop-blur sm:p-4">
      <div
        className={cn(
          'mx-auto max-w-3xl rounded-2xl border border-border bg-card p-2 shadow-sm',
          disabled && 'opacity-60',
        )}
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (disabled || isStreaming) return
          void addFiles(e.dataTransfer.files)
        }}
      >
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5 px-1">
            {attachments.map((file) => (
              <div
                key={file.id}
                className="flex max-w-full items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2 py-1 text-xs"
              >
                {file.kind === 'image' ? (
                  <ImageIcon className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                )}
                <span className="truncate">{file.name}</span>
                <span className="shrink-0 text-muted-foreground">
                  {formatBytes(file.size)}
                </span>
                <button
                  type="button"
                  className="rounded p-0.5 hover:bg-accent"
                  aria-label={`Remove ${file.name}`}
                  onClick={() =>
                    setAttachments((prev) => prev.filter((a) => a.id !== file.id))
                  }
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            multiple
            accept=".txt,.md,.log,.json,.csv,.ts,.tsx,.js,.jsx,.py,.rs,.go,.java,.c,.cpp,.h,.css,.html,.xml,.yaml,.yml,.toml,.sh,.sql,.png,.jpg,.jpeg,.gif,.webp,text/*,image/*"
            onChange={(e) => void addFiles(e.target.files)}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="shrink-0 rounded-xl"
            disabled={
              disabled ||
              isStreaming ||
              reading ||
              attachments.length >= ATTACHMENT_CONSTRAINTS.maxFiles
            }
            onClick={() => fileRef.current?.click()}
            aria-label="Attach files"
            title={describeAttachmentLimits()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <textarea
            ref={ref}
            rows={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="max-h-[200px] min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          {isStreaming ? (
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="shrink-0 rounded-xl"
              onClick={onStop}
              aria-label="Stop generation"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              className="shrink-0 rounded-xl"
              onClick={submit}
              disabled={
                disabled || reading || (!value.trim() && attachments.length === 0)
              }
              aria-label="Send message"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {attachError && (
        <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-destructive">
          {attachError}
        </p>
      )}
      <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-muted-foreground">
        Enter to send · Shift+Enter for newline · {describeAttachmentLimits()}
      </p>
    </div>
  )
}
