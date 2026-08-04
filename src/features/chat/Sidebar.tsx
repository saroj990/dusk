import { useMemo, useState } from 'react'
import {
  MessageSquarePlus,
  Trash2,
  PanelLeftClose,
  PanelLeft,
  Settings,
  FolderPlus,
  Folder,
  FolderInput,
  BookText,
  Boxes,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useChatStore } from '@/stores/chatStore'
import { useProjectStore } from '@/stores/projectStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { formatRelativeTime, cn } from '@/utils/cn'

interface SidebarProps {
  onOpenSettings: () => void
  onOpenPrompts: () => void
  onOpenModels: () => void
  mobileOpen?: boolean
  onCloseMobile?: () => void
}

export function Sidebar({
  onOpenSettings,
  onOpenPrompts,
  onOpenModels,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const chats = useChatStore((s) => s.chats)
  const activeChatId = useChatStore((s) => s.activeChatId)
  const selectChat = useChatStore((s) => s.selectChat)
  const deleteChat = useChatStore((s) => s.deleteChat)
  const createChat = useChatStore((s) => s.createChat)
  const moveChatToProject = useChatStore((s) => s.moveChatToProject)
  const clearProjectFromChats = useChatStore((s) => s.clearProjectFromChats)

  const projects = useProjectStore((s) => s.projects)
  const createProject = useProjectStore((s) => s.createProject)
  const deleteProject = useProjectStore((s) => s.deleteProject)

  const settings = useSettingsStore((s) => s.settings)
  const setSidebarCollapsed = useSettingsStore((s) => s.setSidebarCollapsed)
  const setActiveProject = useSettingsStore((s) => s.setActiveProject)
  const collapsed = settings.sidebarCollapsed
  const activeProjectId = settings.activeProjectId

  const [newProjectName, setNewProjectName] = useState('')
  const [addingProject, setAddingProject] = useState(false)

  const visibleChats = useMemo(() => {
    if (!activeProjectId) return chats
    return chats.filter((c) => c.projectId === activeProjectId)
  }, [activeProjectId, chats])

  const projectNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const project of projects) map.set(project.id, project.name)
    return map
  }, [projects])

  const newChat = async () => {
    await createChat(
      settings.activeProviderId,
      settings.activeModel,
      settings.activeProjectId,
    )
    onCloseMobile?.()
  }

  const submitProject = async () => {
    const name = newProjectName.trim()
    if (!name) return
    const project = await createProject(name)
    setNewProjectName('')
    setAddingProject(false)
    await setActiveProject(project.id)
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
          <div className="hidden flex-col gap-1 px-3 pb-2 md:flex">
            <Button variant="ghost" size="icon" onClick={newChat} aria-label="New chat">
              <MessageSquarePlus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onOpenPrompts} aria-label="Prompts">
              <BookText className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onOpenModels} aria-label="Models">
              <Boxes className="h-4 w-4" />
            </Button>
          </div>
        )}

        {!collapsed && (
          <div className="space-y-3 px-2 pb-2">
            <div>
              <div className="mb-1 flex items-center justify-between px-2">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Projects
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setAddingProject((v) => !v)}
                  aria-label="Add project"
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                </Button>
              </div>

              {addingProject && (
                <div className="mb-1 flex gap-1 px-1">
                  <Input
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Project name"
                    className="h-8"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void submitProject()
                    }}
                    autoFocus
                  />
                  <Button size="sm" className="h-8" onClick={() => void submitProject()}>
                    Add
                  </Button>
                </div>
              )}

              <button
                type="button"
                className={cn(
                  'mb-0.5 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-sidebar-accent',
                  activeProjectId === null && 'bg-sidebar-accent',
                )}
                onClick={() => void setActiveProject(null)}
              >
                <Folder className="h-3.5 w-3.5 shrink-0 opacity-70" />
                All chats
              </button>

              {projects.map((project) => (
                <div
                  key={project.id}
                  className={cn(
                    'group mb-0.5 flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm hover:bg-sidebar-accent',
                    activeProjectId === project.id && 'bg-sidebar-accent',
                  )}
                >
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    onClick={() => void setActiveProject(project.id)}
                  >
                    <Folder className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    <span className="truncate">{project.name}</span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                    onClick={async () => {
                      await clearProjectFromChats(project.id)
                      await deleteProject(project.id)
                      if (activeProjectId === project.id) {
                        await setActiveProject(null)
                      }
                    }}
                    aria-label={`Delete ${project.name}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-1 px-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 justify-start"
                onClick={onOpenPrompts}
              >
                <BookText className="h-3.5 w-3.5" />
                Prompts
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 justify-start"
                onClick={onOpenModels}
              >
                <Boxes className="h-3.5 w-3.5" />
                Models
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {!collapsed &&
            visibleChats.map((chat) => (
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
                    {chat.projectId &&
                      activeProjectId === null &&
                      projectNameById.get(chat.projectId) &&
                      ` · ${projectNameById.get(chat.projectId)}`}
                  </div>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                      aria-label="Move to project"
                      title="Move to project"
                    >
                      <FolderInput className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Move to project</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => void moveChatToProject(chat.id, null)}
                    >
                      <span className="flex-1">No project</span>
                      {!chat.projectId && <Check className="h-3.5 w-3.5" />}
                    </DropdownMenuItem>
                    {projects.length === 0 ? (
                      <DropdownMenuItem disabled>
                        Create a project first
                      </DropdownMenuItem>
                    ) : (
                      projects.map((project) => (
                        <DropdownMenuItem
                          key={project.id}
                          onClick={() =>
                            void moveChatToProject(chat.id, project.id)
                          }
                        >
                          <span className="flex-1 truncate">{project.name}</span>
                          {chat.projectId === project.id && (
                            <Check className="h-3.5 w-3.5" />
                          )}
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
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
