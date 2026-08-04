import type { ChatChunk, ChatRequest, Model } from '@/types'
import type { AIProvider } from './types'

interface OpenAIModelsResponse {
  data?: Array<{ id: string; created?: number }>
}

interface OpenAIChatChunk {
  choices?: Array<{
    delta?: { content?: string; role?: string }
    finish_reason?: string | null
  }>
  error?: { message?: string }
}

export class OpenAICompatibleProvider implements AIProvider {
  readonly id: string
  readonly name: string
  private baseUrl: string
  private apiKey?: string

  constructor(
    baseUrl: string,
    apiKey?: string,
    id = 'openai',
    name = 'OpenAI Compatible',
  ) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
    this.id = id
    this.name = name
  }

  configure(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.apiKey = apiKey
  }

  private url(path: string): string {
    const base = this.baseUrl.replace(/\/$/, '')
    // Accept both https://host/v1 and https://host
    if (base.endsWith('/v1') && path.startsWith('/v1')) {
      return `${base}${path.slice(3)}`
    }
    if (!base.endsWith('/v1') && !path.startsWith('/v1')) {
      return `${base}/v1${path}`
    }
    return `${base}${path}`
  }

  private headers(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (this.apiKey?.trim()) {
      headers.Authorization = `Bearer ${this.apiKey.trim()}`
    }
    return headers
  }

  async health(): Promise<boolean> {
    try {
      const res = await fetch(this.url('/models'), {
        method: 'GET',
        headers: this.headers(),
      })
      return res.ok
    } catch {
      return false
    }
  }

  async listModels(): Promise<Model[]> {
    const res = await fetch(this.url('/models'), { headers: this.headers() })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `Failed to list models (${res.status})`)
    }
    const data = (await res.json()) as OpenAIModelsResponse
    return (data.data ?? [])
      .map((m) => ({
        id: m.id,
        name: m.id,
        modifiedAt: m.created
          ? new Date(m.created * 1000).toISOString()
          : undefined,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  async *chat(request: ChatRequest): AsyncIterable<ChatChunk> {
    const messages = [...request.messages]
    if (request.system?.trim()) {
      messages.unshift({ role: 'system', content: request.system })
    }

    const res = await fetch(this.url('/chat/completions'), {
      method: 'POST',
      headers: this.headers(),
      signal: request.signal,
      body: JSON.stringify({
        model: request.model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        stream: true,
        temperature: request.temperature,
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `Chat request failed (${res.status})`)
    }

    if (!res.body) {
      throw new Error('No response body from provider')
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith(':')) continue

          const payload = trimmed.startsWith('data:')
            ? trimmed.slice(5).trim()
            : trimmed

          if (!payload) continue
          if (payload === '[DONE]') {
            yield { content: '', done: true }
            return
          }

          let chunk: OpenAIChatChunk
          try {
            chunk = JSON.parse(payload) as OpenAIChatChunk
          } catch {
            continue
          }

          if (chunk.error?.message) {
            throw new Error(chunk.error.message)
          }

          const content = chunk.choices?.[0]?.delta?.content ?? ''
          if (content) {
            yield { content, done: false }
          }

          if (chunk.choices?.[0]?.finish_reason) {
            yield { content: '', done: true }
            return
          }
        }
      }

      yield { content: '', done: true }
    } finally {
      reader.releaseLock()
    }
  }
}
