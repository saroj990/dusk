import { useMemo, useState } from 'react'
import { Download, Star, Trash2 } from 'lucide-react'
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
import { Separator } from '@/components/ui/separator'
import { useModelStore } from '@/stores/modelStore'
import {
  getActiveProviderConfig,
  useSettingsStore,
} from '@/stores/settingsStore'
import { formatBytes, cn } from '@/utils/cn'

interface ModelManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ModelManagerDialog({
  open,
  onOpenChange,
}: ModelManagerDialogProps) {
  const settings = useSettingsStore((s) => s.settings)
  const setActiveModel = useSettingsStore((s) => s.setActiveModel)
  const toggleFavoriteModel = useSettingsStore((s) => s.toggleFavoriteModel)
  const models = useModelStore((s) => s.models)
  const loading = useModelStore((s) => s.loading)
  const actionError = useModelStore((s) => s.actionError)
  const pullModel = useModelStore((s) => s.pullModel)
  const deleteModel = useModelStore((s) => s.deleteModel)
  const clearActionError = useModelStore((s) => s.clearActionError)

  const [pullName, setPullName] = useState('')
  const provider = getActiveProviderConfig(settings)
  const canManage = provider.type === 'ollama'
  const favoriteIds = settings.favoriteModels
  const favorites = new Set(favoriteIds)
  const recent = settings.recentModels.filter((id) =>
    models.some((m) => m.id === id),
  )

  const sorted = useMemo(() => {
    const fav = new Set(favoriteIds)
    return [...models].sort((a, b) => {
      const af = fav.has(a.id) ? 0 : 1
      const bf = fav.has(b.id) ? 0 : 1
      if (af !== bf) return af - bf
      return a.name.localeCompare(b.name)
    })
  }, [favoriteIds, models])

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) clearActionError()
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Models</DialogTitle>
          <DialogDescription>
            Manage models for {provider.name}. Favorites and recent models are
            stored locally.
          </DialogDescription>
        </DialogHeader>

        {canManage && (
          <div className="space-y-2">
            <Label htmlFor="pullName">Pull model</Label>
            <div className="flex gap-2">
              <Input
                id="pullName"
                value={pullName}
                onChange={(e) => setPullName(e.target.value)}
                placeholder="e.g. llama3.2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && pullName.trim()) {
                    void pullModel(provider, pullName.trim()).then(() =>
                      setPullName(''),
                    )
                  }
                }}
              />
              <Button
                disabled={!pullName.trim() || loading}
                onClick={() => {
                  void pullModel(provider, pullName.trim()).then(() =>
                    setPullName(''),
                  )
                }}
              >
                <Download className="h-4 w-4" />
                Pull
              </Button>
            </div>
          </div>
        )}

        {actionError && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {actionError}
          </p>
        )}

        {recent.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Recent
            </p>
            <div className="flex flex-wrap gap-1.5">
              {recent.map((id) => (
                <Button
                  key={id}
                  size="sm"
                  variant="secondary"
                  className="h-7"
                  onClick={() => void setActiveModel(id)}
                >
                  {id}
                </Button>
              ))}
            </div>
          </div>
        )}

        <Separator />

        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Installed ({sorted.length})
          </p>
          {sorted.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              No models found. {canManage ? 'Pull one above.' : 'Check the provider connection.'}
            </p>
          ) : (
            sorted.map((model) => (
              <div
                key={model.id}
                className={cn(
                  'flex items-center gap-2 rounded-lg border border-transparent px-2 py-2 hover:bg-muted/50',
                  settings.activeModel === model.id && 'border-border bg-muted/40',
                )}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => void setActiveModel(model.id)}
                >
                  <div className="truncate text-sm font-medium">{model.name}</div>
                  {model.size !== undefined && (
                    <div className="text-[11px] text-muted-foreground">
                      {formatBytes(model.size)}
                    </div>
                  )}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => void toggleFavoriteModel(model.id)}
                  aria-label="Favorite"
                >
                  <Star
                    className={`h-3.5 w-3.5 ${
                      favorites.has(model.id)
                        ? 'fill-amber-500 text-amber-500'
                        : ''
                    }`}
                  />
                </Button>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    disabled={loading}
                    onClick={() => {
                      if (window.confirm(`Delete model "${model.name}"?`)) {
                        void deleteModel(provider, model.id)
                      }
                    }}
                    aria-label="Delete model"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
