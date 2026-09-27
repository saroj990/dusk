import { useDeferredValue, useMemo } from 'react'
import { Search as SearchIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { searchChats, type SearchHit } from '@/features/chat/searchChats'
import { useChatStore } from '@/stores/chatStore'
import { cn } from '@/utils/cn'
import type { Chat } from '@/types'

interface ChatSearchProps {
  chats: Chat[]
  query: string
  onQueryChange: (query: string) => void
  onSelectHit: (hit: SearchHit) => void
}

export function ChatSearch({
  chats,
  query,
  onQueryChange,
  onSelectHit,
}: ChatSearchProps) {
  const deferredQuery = useDeferredValue(query)
  const hits = useMemo(
    () => searchChats(chats, deferredQuery),
    [chats, deferredQuery],
  )
  const activeChatId = useChatStore((s) => s.activeChatId)
  const focusedMessageId = useChatStore((s) => s.focusedMessageId)
  const searching = query.trim().length > 0

  return (
    <div className="space-y-2 px-2 pb-2">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search chats…"
          className="h-8 pl-8"
          aria-label="Search chats"
        />
      </div>

      {searching && (
        <div className="max-h-56 space-y-0.5 overflow-y-auto rounded-lg border border-border bg-background/60 p-1">
          {hits.length === 0 ? (
            <p className="px-2 py-3 text-xs text-muted-foreground">
              No matches for “{query.trim()}”
            </p>
          ) : (
            hits.map((hit, index) => {
              const selected =
                hit.chatId === activeChatId &&
                (hit.messageId
                  ? hit.messageId === focusedMessageId
                  : !focusedMessageId)

              return (
                <button
                  key={`${hit.chatId}-${hit.messageId ?? 'title'}-${index}`}
                  type="button"
                  className={cn(
                    'w-full rounded-md px-2 py-1.5 text-left hover:bg-sidebar-accent',
                    selected && 'bg-sidebar-accent',
                  )}
                  onClick={() => onSelectHit(hit)}
                >
                  <div className="truncate text-xs font-medium">
                    {hit.chatTitle}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {hit.role === 'title'
                      ? 'Title match'
                      : `${hit.role}: ${hit.snippet}`}
                  </div>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
