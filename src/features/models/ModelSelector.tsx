import { RefreshCw, Star } from 'lucide-react'
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
  const setActiveProvider = useSettingsStore((s) => s.setActiveProvider)
  const toggleFavoriteModel = useSettingsStore((s) => s.toggleFavoriteModel)
  const models = useModelStore((s) => s.models)
  const loading = useModelStore((s) => s.loading)
  const connected = useModelStore((s) => s.connected)
  const error = useModelStore((s) => s.error)
  const refresh = useModelStore((s) => s.refresh)

  const enabledProviders = settings.providers.filter((p) => p.enabled)
  const provider = getActiveProviderConfig(settings)
  const favorites = new Set(settings.favoriteModels)

  const sortedModels = [...models].sort((a, b) => {
    const af = favorites.has(a.id) ? 0 : 1
    const bf = favorites.has(b.id) ? 0 : 1
    if (af !== bf) return af - bf
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <Select
        value={provider?.id}
        onValueChange={(id) => void setActiveProvider(id)}
      >
        <SelectTrigger className="h-8 w-[140px] sm:w-[160px]">
          <SelectValue placeholder="Provider" />
        </SelectTrigger>
        <SelectContent>
          {enabledProviders.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={settings.activeModel || undefined}
        onValueChange={(id) => void setActiveModel(id)}
        disabled={!models.length}
      >
        <SelectTrigger className="h-8 w-[160px] sm:w-[220px]">
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
          {sortedModels.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <span className="flex items-center gap-1.5">
                {favorites.has(model.id) && (
                  <Star className="h-3 w-3 fill-current text-amber-500" />
                )}
                {model.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {settings.activeModel && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => void toggleFavoriteModel(settings.activeModel)}
          aria-label="Toggle favorite model"
          title="Favorite model"
        >
          <Star
            className={`h-3.5 w-3.5 ${
              favorites.has(settings.activeModel)
                ? 'fill-amber-500 text-amber-500'
                : ''
            }`}
          />
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => void refresh(provider)}
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
