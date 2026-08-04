import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sidebar } from '@/features/chat/Sidebar'
import { ChatView } from '@/features/chat/ChatView'
import { ChatInput, type InsertRequest } from '@/features/chat/ChatInput'
import { ModelSelector } from '@/features/models/ModelSelector'
import { ModelManagerDialog } from '@/features/models/ModelManagerDialog'
import { PromptLibraryDialog } from '@/features/prompts/PromptLibraryDialog'
import { SettingsDialog } from '@/features/settings/SettingsDialog'
import { useChat } from '@/hooks/useChat'
import { useTheme } from '@/hooks/useTheme'
import { useChatStore } from '@/stores/chatStore'
import { useModelStore } from '@/stores/modelStore'
import { usePromptStore } from '@/stores/promptStore'
import { useProjectStore } from '@/stores/projectStore'
import {
  getActiveProviderConfig,
  useSettingsStore,
} from '@/stores/settingsStore'

export function App() {
  useTheme()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [promptsOpen, setPromptsOpen] = useState(false)
  const [modelsOpen, setModelsOpen] = useState(false)
  const [mobileSidebar, setMobileSidebar] = useState(false)
  const [insertRequest, setInsertRequest] = useState<InsertRequest | null>(null)

  const hydrateSettings = useSettingsStore((s) => s.hydrate)
  const hydrateChats = useChatStore((s) => s.hydrate)
  const hydratePrompts = usePromptStore((s) => s.hydrate)
  const hydrateProjects = useProjectStore((s) => s.hydrate)
  const settingsHydrated = useSettingsStore((s) => s.hydrated)
  const chatsHydrated = useChatStore((s) => s.hydrated)
  const settings = useSettingsStore((s) => s.settings)
  const setActiveModel = useSettingsStore((s) => s.setActiveModel)
  const refreshModels = useModelStore((s) => s.refresh)
  const models = useModelStore((s) => s.models)
  const { send, stop, isStreaming } = useChat()

  useEffect(() => {
    void hydrateSettings()
    void hydrateChats()
    void hydratePrompts()
    void hydrateProjects()
  }, [hydrateChats, hydratePrompts, hydrateProjects, hydrateSettings])

  useEffect(() => {
    if (!settingsHydrated) return
    const provider = getActiveProviderConfig(settings)
    void refreshModels(provider)
  }, [
    settingsHydrated,
    settings.activeProviderId,
    settings.providers,
    refreshModels,
    settings,
  ])

  useEffect(() => {
    if (!models.length) return
    if (!settings.activeModel || !models.some((m) => m.id === settings.activeModel)) {
      void setActiveModel(models[0].id)
    }
  }, [models, setActiveModel, settings.activeModel])

  if (!settingsHydrated || !chatsHydrated) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <Sidebar
        onOpenSettings={() => {
          setSettingsOpen(true)
          setMobileSidebar(false)
        }}
        onOpenPrompts={() => {
          setPromptsOpen(true)
          setMobileSidebar(false)
        }}
        onOpenModels={() => {
          setModelsOpen(true)
          setMobileSidebar(false)
        }}
        mobileOpen={mobileSidebar}
        onCloseMobile={() => setMobileSidebar(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileSidebar(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <ModelSelector />
          </div>
        </header>

        <ChatView />

        <ChatInput
          onSend={send}
          onStop={stop}
          isStreaming={isStreaming}
          disabled={!settings.activeModel}
          insertRequest={insertRequest}
          placeholder={
            settings.activeModel
              ? `Message ${settings.activeModel}…`
              : 'Select a model to start chatting…'
          }
        />
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <PromptLibraryDialog
        open={promptsOpen}
        onOpenChange={setPromptsOpen}
        onInsert={(text) =>
          setInsertRequest({ id: Date.now(), text })
        }
      />
      <ModelManagerDialog open={modelsOpen} onOpenChange={setModelsOpen} />
    </div>
  )
}
