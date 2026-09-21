import { useCallback } from 'react'
import { getProvider } from '@/services/providers/registry'
import { messageToProviderMessage } from '@/features/chat/attachments'
import { useChatStore } from '@/stores/chatStore'
import {
  getActiveProviderConfig,
  useSettingsStore,
} from '@/stores/settingsStore'
import { createId } from '@/utils/cn'
import type { Attachment, WebSearchHit } from '@/types'
import { searchWeb } from '@/services/webSearch'

/** Shared across hook instances so Stop works from any caller. */
let activeAbort: AbortController | null = null

export function useChat() {
  const {
    createChat,
    appendMessage,
    updateMessage,
    setMessages,
    setStreaming,
    setStreamingContent,
    setError,
    getActiveChat,
    isStreaming,
  } = useChatStore()

  const stop = useCallback(() => {
    activeAbort?.abort()
    activeAbort = null
    setStreaming(false)
  }, [setStreaming])

  const runGeneration = useCallback(
    async (chatId: string) => {
      const settings = useSettingsStore.getState().settings
      const providerConfig = getActiveProviderConfig(settings)
      const chat = useChatStore.getState().chats.find((c) => c.id === chatId)
      if (!chat) return

      if (!settings.activeModel) {
        setError('Select a model first')
        return
      }

      const assistantId = createId()
      await appendMessage(chatId, {
        id: assistantId,
        role: 'assistant',
        content: '',
      })

      const history =
        useChatStore
          .getState()
          .chats.find((c) => c.id === chatId)
          ?.messages.filter((m) => m.id !== assistantId) ?? []

      const controller = new AbortController()
      activeAbort = controller
      setStreaming(true)
      setStreamingContent('')
      setError(null)

      let accumulated = ''

      try {
        const provider = getProvider(providerConfig)
        const stream = provider.chat({
          model: settings.activeModel,
          messages: history.map(messageToProviderMessage),
          system: settings.systemPrompt || undefined,
          temperature: settings.temperature,
          signal: controller.signal,
        })

        for await (const chunk of stream) {
          if (chunk.content) {
            accumulated += chunk.content
            setStreamingContent(accumulated)
            await updateMessage(chatId, assistantId, accumulated)
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          if (!accumulated) {
            const fresh = useChatStore.getState().chats.find((c) => c.id === chatId)
            if (fresh) {
              await setMessages(
                chatId,
                fresh.messages.filter((m) => m.id !== assistantId),
              )
            }
          }
        } else {
          const message = err instanceof Error ? err.message : 'Generation failed'
          setError(message)
          if (!accumulated) {
            const fresh = useChatStore.getState().chats.find((c) => c.id === chatId)
            if (fresh) {
              await setMessages(
                chatId,
                fresh.messages.filter((m) => m.id !== assistantId),
              )
            }
          }
        }
      } finally {
        if (activeAbort === controller) activeAbort = null
        setStreaming(false)
        setStreamingContent('')
      }
    },
    [
      appendMessage,
      setError,
      setMessages,
      setStreaming,
      setStreamingContent,
      updateMessage,
    ],
  )

  const send = useCallback(
    async (
      content: string,
      attachments: Attachment[] = [],
      options?: { webSearch?: boolean },
    ) => {
      const trimmed = content.trim()
      if ((!trimmed && attachments.length === 0) || isStreaming) return

      const settings = useSettingsStore.getState().settings
      const providerConfig = getActiveProviderConfig(settings)

      if (!settings.activeModel) {
        setError('Select a model first')
        return
      }

      let chat = getActiveChat()
      if (!chat) {
        chat = await createChat(
          providerConfig.id,
          settings.activeModel,
          settings.activeProjectId,
        )
      }

      let webSearch: WebSearchHit[] | undefined
      if (options?.webSearch && trimmed) {
        try {
          webSearch = await searchWeb(trimmed, settings)
          if (!webSearch.length) {
            setError('Web search returned no results; sending your question anyway.')
          } else {
            setError(null)
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Web search failed')
          return
        }
      }

      await appendMessage(chat.id, {
        role: 'user',
        content: trimmed,
        attachments: attachments.length ? attachments : undefined,
        webSearch: webSearch?.length ? webSearch : undefined,
      })
      await runGeneration(chat.id)
    },
    [
      appendMessage,
      createChat,
      getActiveChat,
      isStreaming,
      runGeneration,
      setError,
    ],
  )

  const regenerate = useCallback(
    async (assistantMessageId: string) => {
      if (isStreaming) return
      const chat = getActiveChat()
      if (!chat) return

      const idx = chat.messages.findIndex((m) => m.id === assistantMessageId)
      if (idx < 0) return

      const truncated = chat.messages.slice(0, idx)
      await setMessages(chat.id, truncated)
      await runGeneration(chat.id)
    },
    [getActiveChat, isStreaming, runGeneration, setMessages],
  )

  const editAndResend = useCallback(
    async (messageId: string, content: string) => {
      if (isStreaming) return
      const trimmed = content.trim()
      if (!trimmed) return

      const chat = getActiveChat()
      if (!chat) return

      const idx = chat.messages.findIndex((m) => m.id === messageId)
      if (idx < 0) return

      const previous = chat.messages[idx]
      await setMessages(chat.id, chat.messages.slice(0, idx))
      await appendMessage(chat.id, {
        role: 'user',
        content: trimmed,
        attachments: previous.attachments,
        webSearch: previous.webSearch,
      })
      await runGeneration(chat.id)
    },
    [appendMessage, getActiveChat, isStreaming, runGeneration, setMessages],
  )

  return { send, stop, regenerate, editAndResend, isStreaming }
}
