import { create } from 'zustand'
import type { Model, ProviderConfig } from '@/types'
import { getProvider } from '@/services/providers/registry'

interface ModelState {
  models: Model[]
  loading: boolean
  connected: boolean | null
  error: string | null
  actionError: string | null
  refresh: (config: ProviderConfig) => Promise<void>
  pullModel: (config: ProviderConfig, name: string) => Promise<void>
  deleteModel: (config: ProviderConfig, name: string) => Promise<void>
  clearActionError: () => void
}

export const useModelStore = create<ModelState>((set) => ({
  models: [],
  loading: false,
  connected: null,
  error: null,
  actionError: null,

  clearActionError: () => set({ actionError: null }),

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

  pullModel: async (config, name) => {
    set({ actionError: null, loading: true })
    try {
      const provider = getProvider(config)
      if (!provider.pullModel) {
        throw new Error('This provider does not support pulling models')
      }
      await provider.pullModel(name)
      const models = await provider.listModels()
      set({ models, connected: true, loading: false })
    } catch (err) {
      set({
        loading: false,
        actionError: err instanceof Error ? err.message : 'Failed to pull model',
      })
    }
  },

  deleteModel: async (config, name) => {
    set({ actionError: null, loading: true })
    try {
      const provider = getProvider(config)
      if (!provider.deleteModel) {
        throw new Error('This provider does not support deleting models')
      }
      await provider.deleteModel(name)
      const models = await provider.listModels()
      set({ models, connected: true, loading: false })
    } catch (err) {
      set({
        loading: false,
        actionError: err instanceof Error ? err.message : 'Failed to delete model',
      })
    }
  },
}))
