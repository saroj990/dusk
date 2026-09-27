import { create } from 'zustand'
import type { Project } from '@/types'
import * as storage from '@/services/storage'
import { createId } from '@/utils/cn'

interface ProjectState {
  projects: Project[]
  hydrated: boolean
  hydrate: () => Promise<void>
  createProject: (name: string) => Promise<Project>
  renameProject: (id: string, name: string) => Promise<void>
  deleteProject: (id: string) => Promise<void>
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  hydrated: false,

  hydrate: async () => {
    const projects = await storage.listProjects()
    set({ projects, hydrated: true })
  },

  createProject: async (name) => {
    const now = Date.now()
    const project: Project = {
      id: createId(),
      name: name.trim() || 'Untitled project',
      createdAt: now,
      updatedAt: now,
    }
    await storage.saveProject(project)
    set((state) => ({ projects: [project, ...state.projects] }))
    return project
  },

  renameProject: async (id, name) => {
    const existing = get().projects.find((p) => p.id === id)
    if (!existing) return
    const updated: Project = {
      ...existing,
      name: name.trim() || existing.name,
      updatedAt: Date.now(),
    }
    await storage.saveProject(updated)
    set((state) => ({
      projects: [updated, ...state.projects.filter((p) => p.id !== id)],
    }))
  },

  deleteProject: async (id) => {
    await storage.deleteProject(id)
    set((state) => ({ projects: state.projects.filter((p) => p.id !== id) }))
  },
}))
