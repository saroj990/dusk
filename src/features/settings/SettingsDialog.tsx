import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import type { ThemeMode } from '@/types'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const settings = useSettingsStore((s) => s.settings)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const updateSettings = useSettingsStore((s) => s.updateSettings)
  const updateProvider = useSettingsStore((s) => s.updateProvider)
  const refresh = useModelStore((s) => s.refresh)
  const provider = getActiveProviderConfig(settings)
  const [baseUrl, setBaseUrl] = useState(provider.baseUrl)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setBaseUrl(provider.baseUrl)
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure appearance, Ollama connection, and generation defaults.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <section className="space-y-2">
            <Label>Theme</Label>
            <Select
              value={settings.theme}
              onValueChange={(v) => setTheme(v as ThemeMode)}
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
              <h3 className="text-sm font-medium">Ollama</h3>
              <p className="text-xs text-muted-foreground">
                Local OpenAI-compatible providers land in Phase 2.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="baseUrl">Base URL</Label>
              <Input
                id="baseUrl"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                onBlur={async () => {
                  const next = baseUrl.trim().replace(/\/$/, '') || provider.baseUrl
                  setBaseUrl(next)
                  await updateProvider(provider.id, { baseUrl: next })
                  const updated = useSettingsStore.getState().settings
                  await refresh(getActiveProviderConfig(updated))
                }}
                placeholder="http://localhost:11434"
              />
            </div>
          </section>

          <Separator />

          <section className="space-y-2">
            <Label htmlFor="systemPrompt">System prompt</Label>
            <Textarea
              id="systemPrompt"
              value={settings.systemPrompt}
              onChange={(e) =>
                updateSettings({ systemPrompt: e.target.value })
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
                updateSettings({ temperature: Number(e.target.value) })
              }
              className="w-full accent-primary"
            />
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
