import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
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
import { Separator } from '@/components/ui/separator'
import { usePromptStore } from '@/stores/promptStore'
import type { Prompt } from '@/types'

interface PromptLibraryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInsert: (content: string) => void
}

export function PromptLibraryDialog({
  open,
  onOpenChange,
  onInsert,
}: PromptLibraryDialogProps) {
  const prompts = usePromptStore((s) => s.prompts)
  const createPrompt = usePromptStore((s) => s.createPrompt)
  const updatePrompt = usePromptStore((s) => s.updatePrompt)
  const deletePrompt = usePromptStore((s) => s.deletePrompt)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const resetForm = () => {
    setTitle('')
    setContent('')
    setEditingId(null)
  }

  const startEdit = (prompt: Prompt) => {
    setEditingId(prompt.id)
    setTitle(prompt.title)
    setContent(prompt.content)
  }

  const save = async () => {
    if (!content.trim()) return
    if (editingId) {
      await updatePrompt(editingId, { title, content })
    } else {
      await createPrompt(title, content)
    }
    resetForm()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetForm()
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Prompt library</DialogTitle>
          <DialogDescription>
            Save reusable prompts and insert them into the composer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="promptTitle">Title</Label>
            <Input
              id="promptTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Code review"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="promptContent">Content</Label>
            <Textarea
              id="promptContent"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write the prompt text…"
              className="min-h-[100px]"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => void save()} disabled={!content.trim()}>
              <Plus className="h-4 w-4" />
              {editingId ? 'Update' : 'Save prompt'}
            </Button>
            {editingId && (
              <Button variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </div>

        <Separator />

        <div className="space-y-1">
          {prompts.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              No saved prompts yet.
            </p>
          ) : (
            prompts.map((prompt) => (
              <div
                key={prompt.id}
                className="rounded-lg border border-border px-3 py-2"
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {prompt.title}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {prompt.content}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      onInsert(prompt.content)
                      onOpenChange(false)
                    }}
                  >
                    Insert
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => startEdit(prompt)}
                    aria-label="Edit prompt"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={() => void deletePrompt(prompt.id)}
                    aria-label="Delete prompt"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
