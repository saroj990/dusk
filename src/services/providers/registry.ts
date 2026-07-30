import type { ProviderConfig } from '@/types'
import { OllamaProvider } from './ollama'
import type { AIProvider } from './types'

const providers = new Map<string, AIProvider>()

export function getProvider(config: ProviderConfig): AIProvider {
  const existing = providers.get(config.id)

  if (config.type === 'ollama') {
    if (existing instanceof OllamaProvider) {
      existing.setBaseUrl(config.baseUrl)
      return existing
    }
    const provider = new OllamaProvider(config.baseUrl, config.id, config.name)
    providers.set(config.id, provider)
    return provider
  }

  throw new Error(`Provider type "${config.type}" is not available in Phase 1`)
}

export function clearProviderCache() {
  providers.clear()
}
