import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useModelStore } from '@/stores/modelStore'
import {
  getActiveProviderConfig,
  useSettingsStore,
} from '@/stores/settingsStore'

export function ModelSelector() {
  const settings = useSettingsStore((s) => s.settings)
  const setActiveModel = useSettingsStore((s) => s.setActiveModel)
  const models = useModelStore((s) => s.models)
  const loading = useModelStore((s) => s.loading)
  const connected = useModelStore((s) => s.connected)
  const error = useModelStore((s) => s.error)
  const refresh = useModelStore((s) => s.refresh)

  const provider = getActiveProviderConfig(settings)

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Select
        value={settings.activeModel || undefined}
        onValueChange={setActiveModel}
        disabled={!models.length}
      >
        <SelectTrigger className="h-8 w-[180px] sm:w-[220px]">
          <SelectValue
            placeholder={
              loading
                ? 'Loading…'
                : connected === false
                  ? 'Not connected'
                  : 'Select model'
            }
          />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              {model.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => refresh(provider)}
        disabled={loading}
        aria-label="Refresh models"
        title={error ?? 'Refresh models'}
      >
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
      </Button>

      <span
        className={`hidden h-2 w-2 shrink-0 rounded-full sm:inline-block ${
          connected === true
            ? 'bg-emerald-500'
            : connected === false
              ? 'bg-red-500'
              : 'bg-muted-foreground/40'
        }`}
        title={
          connected === true
            ? 'Connected'
            : connected === false
              ? error ?? 'Disconnected'
              : 'Checking…'
        }
      />
    </div>
  )
}
