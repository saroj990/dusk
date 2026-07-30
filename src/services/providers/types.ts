import type { ChatChunk, ChatRequest, Model } from '@/types'

export interface AIProvider {
  id: string
  name: string
  listModels(): Promise<Model[]>
  chat(request: ChatRequest): AsyncIterable<ChatChunk>
  pullModel?(name: string): Promise<void>
  deleteModel?(name: string): Promise<void>
  health?(): Promise<boolean>
}
