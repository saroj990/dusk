import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { AppSettings, Chat } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'

interface OllamaClientDB extends DBSchema {
  chats: {
    key: string
    value: Chat
    indexes: { 'by-updated': number }
  }
  settings: {
    key: string
    value: AppSettings
  }
}

const DB_NAME = 'ollama-client'
const DB_VERSION = 1
const SETTINGS_KEY = 'app'

let dbPromise: Promise<IDBPDatabase<OllamaClientDB>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<OllamaClientDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const chats = db.createObjectStore('chats', { keyPath: 'id' })
        chats.createIndex('by-updated', 'updatedAt')
        db.createObjectStore('settings')
      },
    })
  }
  return dbPromise
}

export async function listChats(): Promise<Chat[]> {
  const db = await getDb()
  const chats = await db.getAllFromIndex('chats', 'by-updated')
  return chats.reverse()
}

export async function getChat(id: string): Promise<Chat | undefined> {
  const db = await getDb()
  return db.get('chats', id)
}

export async function saveChat(chat: Chat): Promise<void> {
  const db = await getDb()
  await db.put('chats', chat)
}

export async function deleteChat(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('chats', id)
}

export async function loadSettings(): Promise<AppSettings> {
  const db = await getDb()
  const stored = await db.get('settings', SETTINGS_KEY)
  if (!stored) return { ...DEFAULT_SETTINGS, providers: [...DEFAULT_SETTINGS.providers] }
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    providers: stored.providers?.length
      ? stored.providers
      : [...DEFAULT_SETTINGS.providers],
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDb()
  await db.put('settings', settings, SETTINGS_KEY)
}
