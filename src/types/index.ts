export type Role = 'system' | 'user' | 'assistant'

export type AttachmentKind = 'text' | 'image'

export interface Attachment {
  id: string
  name: string
  mimeType: string
  kind: AttachmentKind
  size: number
  /** Extracted / truncated text for text attachments */
  text?: string
  /** Raw base64 (no data: prefix) for image attachments */
  base64?: string
}

export interface WebSearchHit {
  title: string
  url: string
  snippet: string
}

export interface Message {
  id: string
  role: Role
  content: string
  createdAt: number
  attachments?: Attachment[]
  webSearch?: WebSearchHit[]
}

export interface Chat {
  id: string
  title: string
  provider: string
  model: string
  projectId: string | null
  createdAt: number
  updatedAt: number
  messages: Message[]
}

export interface Project {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

export interface Prompt {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
}

export interface Model {
  id: string
  name: string
  size?: number
  modifiedAt?: string
  details?: Record<string, unknown>
}

export interface ProviderMessage {
  role: Role
  content: string
  /** Base64 image payloads (no data: prefix) for vision models */
  images?: string[]
}

export interface ChatRequest {
  model: string
  messages: ProviderMessage[]
  system?: string
  temperature?: number
  signal?: AbortSignal
}

export interface ChatChunk {
  content: string
  done: boolean
}

export type ThemeMode = 'system' | 'light' | 'dark'

export type WebSearchProvider = 'duckduckgo' | 'wikipedia' | 'brave'

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
  activeProjectId: string | null
  systemPrompt: string
  temperature: number
  providers: ProviderConfig[]
  favoriteModels: string[]
  recentModels: string[]
  sidebarCollapsed: boolean
  webSearchProvider: WebSearchProvider
  webSearchApiKey: string
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  activeProviderId: 'ollama',
  activeModel: '',
  activeProjectId: null,
  systemPrompt: '',
  temperature: 0.7,
  sidebarCollapsed: false,
  favoriteModels: [],
  recentModels: [],
  webSearchProvider: 'duckduckgo',
  webSearchApiKey: '',
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
