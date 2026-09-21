import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  getActiveProviderConfig,
  useSettingsStore,
} from '@/stores/settingsStore'
import { useModelStore } from '@/stores/modelStore'
import type { ProviderConfig, ThemeMode, WebSearchProvider } from '@/types'
import { Plus, Trash2 } from 'lucide-react'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const settings = useSettingsStore((s) => s.settings)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const updateSettings = useSettingsStore((s) => s.updateSettings)
  const updateProvider = useSettingsStore((s) => s.updateProvider)
  const addProvider = useSettingsStore((s) => s.addProvider)
  const removeProvider = useSettingsStore((s) => s.removeProvider)
  const setActiveProvider = useSettingsStore((s) => s.setActiveProvider)
  const refresh = useModelStore((s) => s.refresh)

  const provider = getActiveProviderConfig(settings)
  const [drafts, setDrafts] = useState<Record<string, ProviderConfig>>({})
  const [newName, setNewName] = useState('OpenAI Compatible')
  const [newBaseUrl, setNewBaseUrl] = useState('http://localhost:1234/v1')
  const [newApiKey, setNewApiKey] = useState('')

  useEffect(() => {
    if (!open) return
    const next: Record<string, ProviderConfig> = {}
    for (const p of settings.providers) next[p.id] = { ...p }
    setDrafts(next)
  }, [open, settings.providers])

  const saveProvider = async (id: string) => {
    const draft = drafts[id]
    if (!draft) return
    await updateProvider(id, {
      name: draft.name.trim() || draft.name,
      baseUrl: draft.baseUrl.trim().replace(/\/$/, ''),
      apiKey: draft.apiKey,
      enabled: draft.enabled,
    })
    const updated = useSettingsStore.getState().settings
    if (updated.activeProviderId === id) {
      await refresh(getActiveProviderConfig(updated))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Appearance, providers, and generation defaults.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <section className="space-y-2">
            <Label>Theme</Label>
            <Select
              value={settings.theme}
              onValueChange={(v) => void setTheme(v as ThemeMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </section>

          <Separator />

          <section className="space-y-3">
            <div>
              <h3 className="text-sm font-medium">Providers</h3>
              <p className="text-xs text-muted-foreground">
                Ollama and any OpenAI-compatible endpoint (LM Studio, vLLM, etc.).
              </p>
            </div>

            {settings.providers.map((p) => {
              const draft = drafts[p.id] ?? p
              return (
                <div
                  key={p.id}
                  className="space-y-2 rounded-lg border border-border p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium">
                      {p.name}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {p.type === 'ollama' ? 'Ollama' : 'OpenAI-compatible'}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {settings.activeProviderId !== p.id && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => void setActiveProvider(p.id)}
                        >
                          Use
                        </Button>
                      )}
                      {settings.providers.length > 1 && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => void removeProvider(p.id)}
                          aria-label="Remove provider"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={draft.name}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [p.id]: { ...draft, name: e.target.value },
                        }))
                      }
                      onBlur={() => void saveProvider(p.id)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Base URL</Label>
                    <Input
                      value={draft.baseUrl}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [p.id]: { ...draft, baseUrl: e.target.value },
                        }))
                      }
                      onBlur={() => void saveProvider(p.id)}
                      placeholder={
                        p.type === 'ollama'
                          ? 'http://localhost:11434'
                          : 'http://localhost:1234/v1'
                      }
                    />
                  </div>
                  {p.type === 'openai-compatible' && (
                    <div className="space-y-2">
                      <Label>API key</Label>
                      <Input
                        type="password"
                        value={draft.apiKey ?? ''}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [p.id]: { ...draft, apiKey: e.target.value },
                          }))
                        }
                        onBlur={() => void saveProvider(p.id)}
                        placeholder="Optional for local servers"
                      />
                    </div>
                  )}
                </div>
              )
            })}

            <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
              <p className="text-sm font-medium">Add OpenAI-compatible</p>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Name"
              />
              <Input
                value={newBaseUrl}
                onChange={(e) => setNewBaseUrl(e.target.value)}
                placeholder="http://localhost:1234/v1"
              />
              <Input
                type="password"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                placeholder="API key (optional)"
              />
              <Button
                className="w-full"
                variant="secondary"
                onClick={async () => {
                  const created = await addProvider({
                    type: 'openai-compatible',
                    name: newName.trim() || 'OpenAI Compatible',
                    baseUrl: newBaseUrl.trim() || 'http://localhost:1234/v1',
                    apiKey: newApiKey.trim() || undefined,
                  })
                  setNewName('OpenAI Compatible')
                  setNewBaseUrl('http://localhost:1234/v1')
                  setNewApiKey('')
                  await refresh(created)
                }}
              >
                <Plus className="h-4 w-4" />
                Add provider
              </Button>
            </div>

            {provider && (
              <p className="text-xs text-muted-foreground">
                Active: {provider.name} · {provider.baseUrl}
              </p>
            )}
          </section>

          <Separator />

          <section className="space-y-3">
            <div>
              <h3 className="text-sm font-medium">Web search</h3>
              <p className="text-xs text-muted-foreground">
                Optional. Turn on the globe icon for one message. DuckDuckGo needs no
                API key (uses the Vite proxy in `npm run dev`). Wikipedia also needs no
                key. Brave needs an API key.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Select
                value={settings.webSearchProvider}
                onValueChange={(v) =>
                  void updateSettings({ webSearchProvider: v as WebSearchProvider })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="duckduckgo">DuckDuckGo (no key)</SelectItem>
                  <SelectItem value="wikipedia">Wikipedia (no key)</SelectItem>
                  <SelectItem value="brave">Brave Search (API key)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {settings.webSearchProvider === 'brave' && (
              <div className="space-y-2">
                <Label htmlFor="braveKey">Brave API key</Label>
                <Input
                  id="braveKey"
                  type="password"
                  value={settings.webSearchApiKey}
                  onChange={(e) =>
                    void updateSettings({ webSearchApiKey: e.target.value })
                  }
                  placeholder="BSA..."
                />
              </div>
            )}
          </section>

          <Separator />

          <section className="space-y-2">
            <Label htmlFor="systemPrompt">Default system prompt</Label>
            <Textarea
              id="systemPrompt"
              value={settings.systemPrompt}
              onChange={(e) =>
                void updateSettings({ systemPrompt: e.target.value })
              }
              placeholder="Optional instructions for the model…"
              className="min-h-[90px]"
            />
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature">Temperature</Label>
              <span className="text-xs tabular-nums text-muted-foreground">
                {settings.temperature.toFixed(1)}
              </span>
            </div>
            <input
              id="temperature"
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={settings.temperature}
              onChange={(e) =>
                void updateSettings({ temperature: Number(e.target.value) })
              }
              className="w-full accent-primary"
            />
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
