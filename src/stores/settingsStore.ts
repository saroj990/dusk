import { create } from 'zustand'
import type { AppSettings, ProviderConfig, ThemeMode } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'
import * as storage from '@/services/storage'
import { createId } from '@/utils/cn'

const RECENT_LIMIT = 12

interface SettingsState {
  settings: AppSettings
  hydrated: boolean
  hydrate: () => Promise<void>
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>
  setTheme: (theme: ThemeMode) => Promise<void>
  setActiveModel: (model: string) => Promise<void>
  setActiveProvider: (providerId: string) => Promise<void>
  setActiveProject: (projectId: string | null) => Promise<void>
  updateProvider: (id: string, patch: Partial<ProviderConfig>) => Promise<void>
  addProvider: (input: Omit<ProviderConfig, 'id' | 'enabled'> & { enabled?: boolean }) => Promise<ProviderConfig>
  removeProvider: (id: string) => Promise<void>
  toggleFavoriteModel: (modelId: string) => Promise<void>
  touchRecentModel: (modelId: string) => Promise<void>
  setSidebarCollapsed: (collapsed: boolean) => Promise<void>
}

async function persist(settings: AppSettings) {
  await storage.saveSettings(settings)
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: {
    ...DEFAULT_SETTINGS,
    providers: [...DEFAULT_SETTINGS.providers],
    favoriteModels: [],
    recentModels: [],
  },
  hydrated: false,

  hydrate: async () => {
    const settings = await storage.loadSettings()
    set({ settings, hydrated: true })
  },

  updateSettings: async (partial) => {
    const settings = { ...get().settings, ...partial }
    set({ settings })
    await persist(settings)
  },

  setTheme: async (theme) => {
    await get().updateSettings({ theme })
  },

  setActiveModel: async (activeModel) => {
    await get().updateSettings({ activeModel })
    if (activeModel) {
      await get().touchRecentModel(activeModel)
    }
  },

  setActiveProvider: async (activeProviderId) => {
    await get().updateSettings({ activeProviderId, activeModel: '' })
  },

  setActiveProject: async (activeProjectId) => {
    await get().updateSettings({ activeProjectId })
  },

  updateProvider: async (id, patch) => {
    const providers = get().settings.providers.map((p) =>
      p.id === id ? { ...p, ...patch } : p,
    )
    await get().updateSettings({ providers })
  },

  addProvider: async (input) => {
    const provider: ProviderConfig = {
      id: createId(),
      enabled: input.enabled ?? true,
      type: input.type,
      name: input.name,
      baseUrl: input.baseUrl.replace(/\/$/, ''),
      apiKey: input.apiKey,
    }
    const providers = [...get().settings.providers, provider]
    await get().updateSettings({ providers, activeProviderId: provider.id, activeModel: '' })
    return provider
  },

  removeProvider: async (id) => {
    const { settings } = get()
    if (settings.providers.length <= 1) return
    const providers = settings.providers.filter((p) => p.id !== id)
    const switching = settings.activeProviderId === id
    await get().updateSettings({
      providers,
      activeProviderId: switching ? providers[0].id : settings.activeProviderId,
      activeModel: switching ? '' : settings.activeModel,
    })
  },

  toggleFavoriteModel: async (modelId) => {
    const current = get().settings.favoriteModels
    const favoriteModels = current.includes(modelId)
      ? current.filter((m) => m !== modelId)
      : [...current, modelId]
    await get().updateSettings({ favoriteModels })
  },

  touchRecentModel: async (modelId) => {
    const recentModels = [
      modelId,
      ...get().settings.recentModels.filter((m) => m !== modelId),
    ].slice(0, RECENT_LIMIT)
    await get().updateSettings({ recentModels })
  },

  setSidebarCollapsed: async (sidebarCollapsed) => {
    await get().updateSettings({ sidebarCollapsed })
  },
}))

export function getActiveProviderConfig(settings: AppSettings): ProviderConfig {
  const enabled = settings.providers.filter((p) => p.enabled)
  return (
    enabled.find((p) => p.id === settings.activeProviderId) ??
    enabled[0] ??
    settings.providers[0]
  )
}
