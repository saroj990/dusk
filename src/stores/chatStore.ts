import { create } from 'zustand'
import type { Chat, Message } from '@/types'
import * as storage from '@/services/storage'
import { createId, truncate } from '@/utils/cn'

interface ChatState {
  chats: Chat[]
  activeChatId: string | null
  isStreaming: boolean
  streamingContent: string
  error: string | null
  hydrated: boolean
  hydrate: () => Promise<void>
  createChat: (provider: string, model: string) => Promise<Chat>
  selectChat: (id: string | null) => void
  deleteChat: (id: string) => Promise<void>
  renameChat: (id: string, title: string) => Promise<void>
  appendMessage: (chatId: string, message: Omit<Message, 'id' | 'createdAt'> & { id?: string }) => Promise<Message>
  updateMessage: (chatId: string, messageId: string, content: string) => Promise<void>
  setMessages: (chatId: string, messages: Message[]) => Promise<void>
  setStreaming: (isStreaming: boolean) => void
  setStreamingContent: (content: string) => void
  setError: (error: string | null) => void
  getActiveChat: () => Chat | null
}

async function persistChat(chat: Chat) {
  await storage.saveChat(chat)
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChatId: null,
  isStreaming: false,
  streamingContent: '',
  error: null,
  hydrated: false,

  hydrate: async () => {
    const chats = await storage.listChats()
    set({
      chats,
      activeChatId: chats[0]?.id ?? null,
      hydrated: true,
    })
  },

  createChat: async (provider, model) => {
    const now = Date.now()
    const chat: Chat = {
      id: createId(),
      title: 'New chat',
      provider,
      model,
      createdAt: now,
      updatedAt: now,
      messages: [],
    }
    await persistChat(chat)
    set((state) => ({
      chats: [chat, ...state.chats],
      activeChatId: chat.id,
      error: null,
      streamingContent: '',
    }))
    return chat
  },

  selectChat: (id) => {
    set({ activeChatId: id, error: null, streamingContent: '' })
  },

  deleteChat: async (id) => {
    await storage.deleteChat(id)
    set((state) => {
      const chats = state.chats.filter((c) => c.id !== id)
      const activeChatId =
        state.activeChatId === id ? (chats[0]?.id ?? null) : state.activeChatId
      return { chats, activeChatId }
    })
  },

  renameChat: async (id, title) => {
    const chat = get().chats.find((c) => c.id === id)
    if (!chat) return
    const updated = { ...chat, title, updatedAt: Date.now() }
    await persistChat(updated)
    set((state) => ({
      chats: state.chats.map((c) => (c.id === id ? updated : c)),
    }))
  },

  appendMessage: async (chatId, message) => {
    const chat = get().chats.find((c) => c.id === chatId)
    if (!chat) throw new Error('Chat not found')

    const full: Message = {
      id: message.id ?? createId(),
      role: message.role,
      content: message.content,
      createdAt: Date.now(),
    }

    const isFirstUser = chat.messages.length === 0 && full.role === 'user'
    const updated: Chat = {
      ...chat,
      title: isFirstUser ? truncate(full.content, 42) : chat.title,
      messages: [...chat.messages, full],
      updatedAt: Date.now(),
    }

    await persistChat(updated)
    set((state) => ({
      chats: [
        updated,
        ...state.chats.filter((c) => c.id !== chatId),
      ],
    }))
    return full
  },

  updateMessage: async (chatId, messageId, content) => {
    const chat = get().chats.find((c) => c.id === chatId)
    if (!chat) return

    const updated: Chat = {
      ...chat,
      messages: chat.messages.map((m) =>
        m.id === messageId ? { ...m, content } : m,
      ),
      updatedAt: Date.now(),
    }

    await persistChat(updated)
    set((state) => ({
      chats: state.chats.map((c) => (c.id === chatId ? updated : c)),
    }))
  },

  setMessages: async (chatId, messages) => {
    const chat = get().chats.find((c) => c.id === chatId)
    if (!chat) return

    const updated: Chat = {
      ...chat,
      messages,
      updatedAt: Date.now(),
    }

    await persistChat(updated)
    set((state) => ({
      chats: [
        updated,
        ...state.chats.filter((c) => c.id !== chatId),
      ],
    }))
  },

  setStreaming: (isStreaming) => set({ isStreaming }),
  setStreamingContent: (streamingContent) => set({ streamingContent }),
  setError: (error) => set({ error }),

  getActiveChat: () => {
    const { chats, activeChatId } = get()
    return chats.find((c) => c.id === activeChatId) ?? null
  },
}))
