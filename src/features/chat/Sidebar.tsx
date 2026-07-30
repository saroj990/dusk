import {
  MessageSquarePlus,
  Trash2,
  PanelLeftClose,
  PanelLeft,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChatStore } from '@/stores/chatStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { formatRelativeTime } from '@/utils/cn'
import { cn } from '@/utils/cn'

interface SidebarProps {
  onOpenSettings: () => void
  mobileOpen?: boolean
  onCloseMobile?: () => void
}

export function Sidebar({
  onOpenSettings,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const chats = useChatStore((s) => s.chats)
  const activeChatId = useChatStore((s) => s.activeChatId)
  const selectChat = useChatStore((s) => s.selectChat)
  const deleteChat = useChatStore((s) => s.deleteChat)
  const createChat = useChatStore((s) => s.createChat)
  const settings = useSettingsStore((s) => s.settings)
  const setSidebarCollapsed = useSettingsStore((s) => s.setSidebarCollapsed)
  const collapsed = settings.sidebarCollapsed

  const newChat = async () => {
    await createChat(settings.activeProviderId, settings.activeModel)
    onCloseMobile?.()
  }

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          aria-label="Close sidebar"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-200 md:static md:z-0',
          collapsed ? 'md:w-14' : 'md:w-64',
          mobileOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full md:translate-x-0',
        )}
      >
        <div className="flex items-center gap-2 p-3">
          {!collapsed && (
            <Button className="flex-1 justify-start" onClick={newChat}>
              <MessageSquarePlus className="h-4 w-4" />
              New chat
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hidden shrink-0 md:inline-flex"
            onClick={() => setSidebarCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>

        {collapsed && (
          <div className="hidden px-3 pb-2 md:block">
            <Button variant="ghost" size="icon" onClick={newChat} aria-label="New chat">
              <MessageSquarePlus className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {!collapsed &&
            chats.map((chat) => (
              <div
                key={chat.id}
                className={cn(
                  'group mb-0.5 flex items-center gap-1 rounded-lg px-2 py-2 text-sm hover:bg-sidebar-accent',
                  activeChatId === chat.id && 'bg-sidebar-accent',
                )}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => {
                    selectChat(chat.id)
                    onCloseMobile?.()
                  }}
                >
                  <div className="truncate font-medium">{chat.title}</div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {formatRelativeTime(chat.updatedAt)}
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100"
                  onClick={() => deleteChat(chat.id)}
                  aria-label="Delete chat"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
        </div>

        <div className="border-t border-border p-2">
          <Button
            variant="ghost"
            className={cn('w-full', collapsed ? 'justify-center px-0' : 'justify-start')}
            onClick={onOpenSettings}
          >
            <Settings className="h-4 w-4" />
            {!collapsed && 'Settings'}
          </Button>
        </div>
      </aside>
    </>
  )
}
