export type Role = 'system' | 'user' | 'assistant'

export interface Message {
  id: string
  role: Role
  content: string
  createdAt: number
}

export interface Chat {
  id: string
  title: string
  provider: string
  model: string
  createdAt: number
  updatedAt: number
  messages: Message[]
}

export interface Model {
  id: string
  name: string
  size?: number
  modifiedAt?: string
  details?: Record<string, unknown>
}

export interface ChatRequest {
  model: string
  messages: Array<{ role: Role; content: string }>
  system?: string
  temperature?: number
  signal?: AbortSignal
}

export interface ChatChunk {
  content: string
  done: boolean
}

export type ThemeMode = 'system' | 'light' | 'dark'

export interface ProviderConfig {
  id: string
  type: 'ollama' | 'openai-compatible'
  name: string
  baseUrl: string
  apiKey?: string
  enabled: boolean
}

export interface AppSettings {
  theme: ThemeMode
  activeProviderId: string
  activeModel: string
  systemPrompt: string
  temperature: number
  providers: ProviderConfig[]
  sidebarCollapsed: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  activeProviderId: 'ollama',
  activeModel: '',
  systemPrompt: '',
  temperature: 0.7,
  sidebarCollapsed: false,
  providers: [
    {
      id: 'ollama',
      type: 'ollama',
      name: 'Ollama',
      baseUrl: 'http://localhost:11434',
      enabled: true,
    },
  ],
}
