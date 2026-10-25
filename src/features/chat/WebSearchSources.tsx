import { ChevronDown, Globe } from 'lucide-react'
import type { WebSearchHit } from '@/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/utils/cn'

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function sourceInitial(url: string): string {
  const host = hostname(url)
  const part = host.split('.')[0] ?? host
  return (part[0] ?? '?').toUpperCase()
}

interface WebSearchSourcesProps {
  hits: WebSearchHit[]
  className?: string
}

export function WebSearchSources({ hits, className }: WebSearchSourcesProps) {
  const count = hits.length
  if (count === 0) return null

  const label = count === 1 ? 'From 1 source' : `From ${count} sources`
  const preview = hits.slice(0, 3)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex max-w-full items-center gap-2 rounded-full border border-border/80 bg-muted/40 px-2.5 py-1 text-left text-xs text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            className,
          )}
          aria-label={`${label}. Show sources`}
        >
          <span className="flex shrink-0 -space-x-1.5" aria-hidden>
            {preview.map((hit, i) => (
              <span
                key={`${i}-${hit.url}`}
                className="flex h-5 w-5 items-center justify-center rounded-full border border-background bg-secondary text-[9px] font-semibold text-secondary-foreground"
                title={hostname(hit.url)}
              >
                {sourceInitial(hit.url)}
              </span>
            ))}
          </span>
          <Globe className="h-3.5 w-3.5 shrink-0 opacity-70" />
          <span className="truncate font-medium">{label}</span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Web search results used for this message
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hits.map((hit, index) => (
          <DropdownMenuItem key={`${index}-${hit.url}`} asChild>
            <a
              href={hit.url}
              target="_blank"
              rel="noreferrer"
              className="flex cursor-pointer flex-col items-start gap-0.5 py-2"
            >
              <span className="line-clamp-1 text-sm font-medium">{hit.title}</span>
              <span className="line-clamp-1 text-[11px] text-muted-foreground">
                {hostname(hit.url)}
              </span>
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
