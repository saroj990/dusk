import type { ChatChunk, ChatRequest, Model } from '@/types'
import type { AIProvider } from './types'

interface OllamaTagsResponse {
  models?: Array<{
    name: string
    model?: string
    size?: number
    modified_at?: string
    details?: Record<string, unknown>
  }>
}

interface OllamaChatStreamChunk {
  message?: { content?: string; role?: string }
  done?: boolean
  error?: string
}

export class OllamaProvider implements AIProvider {
  readonly id: string
  readonly name: string
  private baseUrl: string

  constructor(baseUrl: string, id = 'ollama', name = 'Ollama') {
    this.baseUrl = baseUrl
    this.id = id
    this.name = name
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '')
  }

  private url(path: string): string {
    return `${this.baseUrl.replace(/\/$/, '')}${path}`
  }

  async health(): Promise<boolean> {
    try {
      const res = await fetch(this.url('/api/tags'), { method: 'GET' })
      return res.ok
    } catch {
      return false
    }
  }

  async listModels(): Promise<Model[]> {
    const res = await fetch(this.url('/api/tags'))
    if (!res.ok) {
      throw new Error(`Failed to list models (${res.status})`)
    }
    const data = (await res.json()) as OllamaTagsResponse
    return (data.models ?? []).map((m) => ({
      id: m.name,
      name: m.name,
      size: m.size,
      modifiedAt: m.modified_at,
      details: m.details,
    }))
  }

  async *chat(request: ChatRequest): AsyncIterable<ChatChunk> {
    const messages = [...request.messages]
    if (request.system?.trim()) {
      messages.unshift({ role: 'system', content: request.system })
    }

    const res = await fetch(this.url('/api/chat'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: request.signal,
      body: JSON.stringify({
        model: request.model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        stream: true,
        options:
          request.temperature !== undefined
            ? { temperature: request.temperature }
            : undefined,
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `Chat request failed (${res.status})`)
    }

    if (!res.body) {
      throw new Error('No response body from Ollama')
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
          if (!trimmed) continue

          let chunk: OllamaChatStreamChunk
          try {
            chunk = JSON.parse(trimmed) as OllamaChatStreamChunk
          } catch {
            continue
          }

          if (chunk.error) {
            throw new Error(chunk.error)
          }

          const content = chunk.message?.content ?? ''
          if (content) {
            yield { content, done: false }
          }

          if (chunk.done) {
            yield { content: '', done: true }
            return
          }
        }
      }

      if (buffer.trim()) {
        try {
          const chunk = JSON.parse(buffer.trim()) as OllamaChatStreamChunk
          const content = chunk.message?.content ?? ''
          if (content) yield { content, done: false }
        } catch {
          // ignore trailing partial JSON
        }
      }

      yield { content: '', done: true }
    } finally {
      reader.releaseLock()
    }
  }

  async pullModel(name: string): Promise<void> {
    const res = await fetch(this.url('/api/pull'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, stream: false }),
    })
    if (!res.ok) {
      throw new Error(`Failed to pull model (${res.status})`)
    }
  }

  async deleteModel(name: string): Promise<void> {
    const res = await fetch(this.url('/api/delete'), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (!res.ok) {
      throw new Error(`Failed to delete model (${res.status})`)
    }
  }
}
