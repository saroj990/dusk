import { create } from 'zustand'
import type { Model } from '@/types'
import { getProvider } from '@/services/providers/registry'
import type { ProviderConfig } from '@/types'

interface ModelState {
  models: Model[]
  loading: boolean
  connected: boolean | null
  error: string | null
  refresh: (config: ProviderConfig) => Promise<void>
}

export const useModelStore = create<ModelState>((set) => ({
  models: [],
  loading: false,
  connected: null,
  error: null,

  refresh: async (config) => {
    set({ loading: true, error: null })
    try {
      const provider = getProvider(config)
      const healthy = provider.health ? await provider.health() : true
      if (!healthy) {
        set({
          models: [],
          connected: false,
          loading: false,
          error: `Cannot reach ${config.name} at ${config.baseUrl}`,
        })
        return
      }
      const models = await provider.listModels()
      set({ models, connected: true, loading: false, error: null })
    } catch (err) {
      set({
        models: [],
        connected: false,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load models',
      })
    }
  },
}))
