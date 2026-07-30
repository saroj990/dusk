import { create } from 'zustand'
import type { AppSettings, ProviderConfig, ThemeMode } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'
import * as storage from '@/services/storage'

interface SettingsState {
  settings: AppSettings
  hydrated: boolean
  hydrate: () => Promise<void>
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>
  setTheme: (theme: ThemeMode) => Promise<void>
  setActiveModel: (model: string) => Promise<void>
  setActiveProvider: (providerId: string) => Promise<void>
  updateProvider: (id: string, patch: Partial<ProviderConfig>) => Promise<void>
  setSidebarCollapsed: (collapsed: boolean) => Promise<void>
}

async function persist(settings: AppSettings) {
  await storage.saveSettings(settings)
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: { ...DEFAULT_SETTINGS, providers: [...DEFAULT_SETTINGS.providers] },
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
  },

  setActiveProvider: async (activeProviderId) => {
    await get().updateSettings({ activeProviderId })
  },

  updateProvider: async (id, patch) => {
    const providers = get().settings.providers.map((p) =>
      p.id === id ? { ...p, ...patch } : p,
    )
    await get().updateSettings({ providers })
  },

  setSidebarCollapsed: async (sidebarCollapsed) => {
    await get().updateSettings({ sidebarCollapsed })
  },
}))

export function getActiveProviderConfig(settings: AppSettings): ProviderConfig {
  return (
    settings.providers.find((p) => p.id === settings.activeProviderId) ??
    settings.providers[0]
  )
}
