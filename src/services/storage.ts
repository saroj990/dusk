import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { AppSettings, Chat, Project, Prompt } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'

interface OllamaClientDB extends DBSchema {
  chats: {
    key: string
    value: Chat
    indexes: { 'by-updated': number; 'by-project': string }
  }
  settings: {
    key: string
    value: AppSettings
  }
  prompts: {
    key: string
    value: Prompt
    indexes: { 'by-updated': number }
  }
  projects: {
    key: string
    value: Project
    indexes: { 'by-updated': number }
  }
}

const DB_NAME = 'ollama-client'
const DB_VERSION = 2
const SETTINGS_KEY = 'app'

let dbPromise: Promise<IDBPDatabase<OllamaClientDB>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<OllamaClientDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        if (oldVersion < 1) {
          const chats = db.createObjectStore('chats', { keyPath: 'id' })
          chats.createIndex('by-updated', 'updatedAt')
          db.createObjectStore('settings')
        }

        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('prompts')) {
            const prompts = db.createObjectStore('prompts', { keyPath: 'id' })
            prompts.createIndex('by-updated', 'updatedAt')
          }
          if (!db.objectStoreNames.contains('projects')) {
            const projects = db.createObjectStore('projects', { keyPath: 'id' })
            projects.createIndex('by-updated', 'updatedAt')
          }

          const chatStore = transaction.objectStore('chats')
          if (!chatStore.indexNames.contains('by-project')) {
            // Values without projectId still index; listChats normalizes to null.
            chatStore.createIndex('by-project', 'projectId')
          }
        }
      },
    })
  }
  return dbPromise
}

export async function listChats(): Promise<Chat[]> {
  const db = await getDb()
  const chats = await db.getAllFromIndex('chats', 'by-updated')
  return chats
    .map((c) => ({ ...c, projectId: c.projectId ?? null }))
    .reverse()
}

export async function getChat(id: string): Promise<Chat | undefined> {
  const db = await getDb()
  const chat = await db.get('chats', id)
  return chat ? { ...chat, projectId: chat.projectId ?? null } : undefined
}

export async function saveChat(chat: Chat): Promise<void> {
  const db = await getDb()
  await db.put('chats', { ...chat, projectId: chat.projectId ?? null })
}

export async function deleteChat(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('chats', id)
}

export async function loadSettings(): Promise<AppSettings> {
  const db = await getDb()
  const stored = await db.get('settings', SETTINGS_KEY)
  if (!stored) {
    return {
      ...DEFAULT_SETTINGS,
      providers: [...DEFAULT_SETTINGS.providers],
      favoriteModels: [],
      recentModels: [],
    }
  }
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    providers: stored.providers?.length
      ? stored.providers
      : [...DEFAULT_SETTINGS.providers],
    favoriteModels: stored.favoriteModels ?? [],
    recentModels: stored.recentModels ?? [],
    activeProjectId: stored.activeProjectId ?? null,
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDb()
  await db.put('settings', settings, SETTINGS_KEY)
}

export async function listPrompts(): Promise<Prompt[]> {
  const db = await getDb()
  const prompts = await db.getAllFromIndex('prompts', 'by-updated')
  return prompts.reverse()
}

export async function savePrompt(prompt: Prompt): Promise<void> {
  const db = await getDb()
  await db.put('prompts', prompt)
}

export async function deletePrompt(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('prompts', id)
}

export async function listProjects(): Promise<Project[]> {
  const db = await getDb()
  const projects = await db.getAllFromIndex('projects', 'by-updated')
  return projects.reverse()
}

export async function saveProject(project: Project): Promise<void> {
  const db = await getDb()
  await db.put('projects', project)
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('projects', id)
}
