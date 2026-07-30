import { useState, type ComponentPropsWithoutRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

function CodeBlock({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<'code'> & { inline?: boolean }) {
  const [copied, setCopied] = useState(false)
  const match = /language-(\w+)/.exec(className || '')
  const isBlock = Boolean(match) || String(children).includes('\n')

  if (!isBlock) {
    return (
      <code
        className={cn(
          'rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]',
          className,
        )}
        {...props}
      >
        {children}
      </code>
    )
  }

  const code = String(children).replace(/\n$/, '')

  const copy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="group relative my-3 overflow-hidden rounded-lg border border-border bg-muted/40">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5 text-xs text-muted-foreground">
        <span>{match?.[1] ?? 'code'}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          onClick={copy}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <pre className="overflow-x-auto p-3 text-sm">
        <code className={cn('font-mono', className)} {...props}>
          {children}
        </code>
      </pre>
    </div>
  )
}

export function Markdown({ content }: { content: string }) {
  return (
    <div className="markdown prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code: CodeBlock,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
