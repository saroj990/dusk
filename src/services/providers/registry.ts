import type { ProviderConfig } from '@/types'
import { OllamaProvider } from './ollama'
import { OpenAICompatibleProvider } from './openai'
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

  if (config.type === 'openai-compatible') {
    if (existing instanceof OpenAICompatibleProvider) {
      existing.configure(config.baseUrl, config.apiKey)
      return existing
    }
    const provider = new OpenAICompatibleProvider(
      config.baseUrl,
      config.apiKey,
      config.id,
      config.name,
    )
    providers.set(config.id, provider)
    return provider
  }

  throw new Error(`Unknown provider type: ${String((config as ProviderConfig).type)}`)
}

export function clearProviderCache() {
  providers.clear()
}
