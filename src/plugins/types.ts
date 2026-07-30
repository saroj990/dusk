/** Extension point reserved for Phase 3 plugin system (MCP, RAG, etc.). */
export type PluginSlot =
  | 'toolbar'
  | 'composer'
  | 'message-action'
  | 'settings'

export interface PluginManifest {
  id: string
  name: string
  version: string
  optional: true
}
