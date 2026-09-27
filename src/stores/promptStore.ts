import { create } from 'zustand'
import type { Prompt } from '@/types'
import * as storage from '@/services/storage'
import { createId } from '@/utils/cn'

interface PromptState {
  prompts: Prompt[]
  hydrated: boolean
  hydrate: () => Promise<void>
  createPrompt: (title: string, content: string) => Promise<Prompt>
  updatePrompt: (id: string, patch: Partial<Pick<Prompt, 'title' | 'content'>>) => Promise<void>
  deletePrompt: (id: string) => Promise<void>
}

export const usePromptStore = create<PromptState>((set, get) => ({
  prompts: [],
  hydrated: false,

  hydrate: async () => {
    const prompts = await storage.listPrompts()
    set({ prompts, hydrated: true })
  },

  createPrompt: async (title, content) => {
    const now = Date.now()
    const prompt: Prompt = {
      id: createId(),
      title: title.trim() || 'Untitled prompt',
      content,
      createdAt: now,
      updatedAt: now,
    }
    await storage.savePrompt(prompt)
    set((state) => ({ prompts: [prompt, ...state.prompts] }))
    return prompt
  },

  updatePrompt: async (id, patch) => {
    const existing = get().prompts.find((p) => p.id === id)
    if (!existing) return
    const updated: Prompt = {
      ...existing,
      ...patch,
      title: patch.title?.trim() || existing.title,
      updatedAt: Date.now(),
    }
    await storage.savePrompt(updated)
    set((state) => ({
      prompts: [updated, ...state.prompts.filter((p) => p.id !== id)],
    }))
  },

  deletePrompt: async (id) => {
    await storage.deletePrompt(id)
    set((state) => ({ prompts: state.prompts.filter((p) => p.id !== id) }))
  },
}))
