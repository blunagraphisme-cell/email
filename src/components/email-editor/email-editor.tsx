'use client'

/**
 * EmailOqui — Visual block email editor
 *
 * Layout: left palette of insertable blocks / center editable list / toggle
 * between "Édition" and "Aperçu" (renders `EmailPreview`).
 *
 * Each block can be edited inline, reordered (up/down), or deleted. The
 * "Insérer une variable" dropdown inserts a {{token}} into the focused input.
 *
 * The component is fully controlled via `value` / `onChange`.
 */
import * as React from 'react'
import {
  ArrowDown,
  ArrowUp,
  Eye,
  Heading1,
  Image as ImageIcon,
  List,
  ListOrdered,
  Minus,
  Pencil,
  Plus,
  Trash2,
  Type,
  Variable,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  type Block,
  type BlockType,
  VARIABLE_TOKENS,
  createBlock,
  substituteVariables,
} from './types'
import { EmailPreview } from './email-preview'

interface EmailEditorProps {
  value: Block[]
  onChange: (blocks: Block[]) => void
  /** Allow caller to render the preview pane in a different container. */
  hidePreviewToggle?: boolean
  /** Force preview mode (read-only). */
  previewOnly?: boolean
  className?: string
}

const BLOCK_PALETTE: { type: BlockType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: 'title', label: 'Titre', icon: Heading1 },
  { type: 'text', label: 'Texte', icon: Type },
  { type: 'button', label: 'Bouton', icon: Plus },
  { type: 'image', label: 'Image', icon: ImageIcon },
  { type: 'divider', label: 'Séparateur', icon: Minus },
  { type: 'list', label: 'Liste', icon: ListOrdered },
]

export function EmailEditor({
  value,
  onChange,
  hidePreviewToggle = false,
  previewOnly = false,
  className,
}: EmailEditorProps) {
  const [mode, setMode] = React.useState<'edit' | 'preview'>(previewOnly ? 'preview' : 'edit')

  const addBlock = (type: BlockType) => {
    onChange([...value, createBlock(type)])
    toast.success(`Bloc « ${labelForType(type)} » ajouté.`)
  }

  const updateBlock = (id: string, patch: Partial<Block>) => {
    onChange(value.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  }

  const removeBlock = (id: string) => {
    onChange(value.filter((b) => b.id !== id))
  }

  const move = (id: string, dir: -1 | 1) => {
    const idx = value.findIndex((b) => b.id === id)
    if (idx === -1) return
    const next = idx + dir
    if (next < 0 || next >= value.length) return
    const copy = value.slice()
    const [item] = copy.splice(idx, 1)
    copy.splice(next, 0, item)
    onChange(copy)
  }

  const insertVariable = (token: string) => {
    const el = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null
    if (!el) {
      // no focused input — append token to last text-ish block
      const last = [...value].reverse().find((b) => b.type === 'text' || b.type === 'title')
      if (last) updateBlock(last.id, { text: `${last.text ?? ''}${token}` })
      return
    }
    const isInput = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
    if (!isInput) {
      toast.message("Cliquez d'abord dans un champ de texte, puis choisissez une variable.")
      return
    }
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? el.value.length
    const newValue = el.value.slice(0, start) + token + el.value.slice(end)
    el.value = newValue
    el.dispatchEvent(new Event('input', { bubbles: true }))
    // Place caret just after the inserted token
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + token.length
      el.setSelectionRange(pos, pos)
    })
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {!hidePreviewToggle && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {BLOCK_PALETTE.map((p) => (
              <Button
                key={p.type}
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => addBlock(p.type)}
                disabled={previewOnly}
                title={`Ajouter : ${p.label}`}
              >
                <p.icon className="size-3.5" />
                <span className="hidden sm:inline">{p.label}</span>
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => insertVariable('')}
              disabled={previewOnly}
            >
              <Variable className="size-3.5" />
              <span className="hidden sm:inline">Variable</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === 'edit' ? 'default' : 'outline'}
              onClick={() => setMode('edit')}
            >
              <Pencil className="size-3.5" />
              <span className="hidden sm:inline">Éditer</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === 'preview' ? 'default' : 'outline'}
              onClick={() => setMode('preview')}
            >
              <Eye className="size-3.5" />
              <span className="hidden sm:inline">Aperçu</span>
            </Button>
          </div>
        </div>
      )}

      {mode === 'preview' || previewOnly ? (
        <EmailPreview blocks={value} compact />
      ) : (
        <BlockEditor
          blocks={value}
          onAdd={addBlock}
          onUpdate={updateBlock}
          onRemove={removeBlock}
          onMove={move}
          onInsertVariable={insertVariable}
        />
      )}
    </div>
  )
}

export default EmailEditor

/* --------------------------- Block editor (list) --------------------------- */

interface BlockEditorProps {
  blocks: Block[]
  onAdd: (t: BlockType) => void
  onUpdate: (id: string, patch: Partial<Block>) => void
  onRemove: (id: string) => void
  onMove: (id: string, dir: -1 | 1) => void
  onInsertVariable: (token: string) => void
}

function BlockEditor({
  blocks,
  onAdd,
  onUpdate,
  onRemove,
  onMove,
  onInsertVariable,
}: BlockEditorProps) {
  if (blocks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          Aucun bloc pour le moment.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Utilisez les boutons ci-dessus pour ajouter un titre, du texte, un bouton, etc.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
          {BLOCK_PALETTE.map((p) => (
            <Button
              key={p.type}
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => onAdd(p.type)}
            >
              <p.icon className="size-3.5" />
              {p.label}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="max-h-[640px] rounded-lg border border-border">
      <div className="divide-y divide-border">
        {blocks.map((b, i) => (
          <BlockRow
            key={b.id}
            block={b}
            index={i}
            total={blocks.length}
            onUpdate={(patch) => onUpdate(b.id, patch)}
            onRemove={() => onRemove(b.id)}
            onMoveUp={() => onMove(b.id, -1)}
            onMoveDown={() => onMove(b.id, 1)}
            onInsertVariable={onInsertVariable}
          />
        ))}
      </div>
    </ScrollArea>
  )
}

interface BlockRowProps {
  block: Block
  index: number
  total: number
  onUpdate: (patch: Partial<Block>) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onInsertVariable: (token: string) => void
}

function BlockRow({
  block,
  index,
  total,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onInsertVariable,
}: BlockRowProps) {
  return (
    <div className="bg-background p-3">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 pt-2">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-7"
            onClick={onMoveUp}
            disabled={index === 0}
            title="Monter"
          >
            <ArrowUp className="size-3.5" />
          </Button>
          <span className="text-[10px] font-medium text-muted-foreground">{index + 1}</span>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-7"
            onClick={onMoveDown}
            disabled={index === total - 1}
            title="Descendre"
          >
            <ArrowDown className="size-3.5" />
          </Button>
        </div>

        <div className="min-w-0 flex-1">
          <BlockFields
            block={block}
            onUpdate={onUpdate}
            onInsertVariable={onInsertVariable}
          />
        </div>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-7 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onRemove}
          title="Supprimer ce bloc"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------- Block fields ------------------------------ */

function BlockFields({
  block,
  onUpdate,
  onInsertVariable,
}: {
  block: Block
  onUpdate: (patch: Partial<Block>) => void
  onInsertVariable: (token: string) => void
}) {
  const alignSelect = (
    <div className="flex items-center gap-2">
      <Label className="text-xs text-muted-foreground">Alignement</Label>
      <div className="inline-flex overflow-hidden rounded-md border border-input">
        {(['left', 'center', 'right'] as const).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => onUpdate({ align: a })}
            className={cn(
              'px-2 py-1 text-xs font-medium capitalize transition-colors',
              (block.align ?? 'left') === a
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-accent'
            )}
          >
            {a === 'left' ? 'G' : a === 'center' ? 'C' : 'D'}
          </button>
        ))}
      </div>
    </div>
  )

  switch (block.type) {
    case 'title':
      return (
        <div className="space-y-2">
          <FieldLabel icon={Heading1} label="Titre" onInsertVariable={onInsertVariable} />
          <Input
            value={block.text ?? ''}
            onChange={(e) => onUpdate({ text: e.target.value })}
            placeholder="Titre de votre e-mail…"
            className="text-base font-semibold"
          />
          {alignSelect}
        </div>
      )

    case 'text':
      return (
        <div className="space-y-2">
          <FieldLabel icon={Type} label="Texte" onInsertVariable={onInsertVariable} />
          <Textarea
            value={block.text ?? ''}
            onChange={(e) => onUpdate({ text: e.target.value })}
            placeholder="Saisissez votre texte…"
            rows={3}
          />
          {alignSelect}
        </div>
      )

    case 'button':
      return (
        <div className="space-y-2">
          <FieldLabel icon={Plus} label="Bouton" onInsertVariable={onInsertVariable} />
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label className="mb-1 text-xs text-muted-foreground">Texte du bouton</Label>
              <Input
                value={block.text ?? ''}
                onChange={(e) => onUpdate({ text: e.target.value })}
                placeholder="Découvrir"
              />
            </div>
            <div>
              <Label className="mb-1 text-xs text-muted-foreground">URL (lien)</Label>
              <Input
                value={block.url ?? ''}
                onChange={(e) => onUpdate({ url: e.target.value })}
                placeholder="https://oquitogo.com"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {alignSelect}
            <ColorField
              label="Fond"
              value={block.bg ?? '#f59e0b'}
              onChange={(v) => onUpdate({ bg: v })}
            />
            <ColorField
              label="Texte"
              value={block.color ?? '#ffffff'}
              onChange={(v) => onUpdate({ color: v })}
            />
          </div>
        </div>
      )

    case 'image':
      return (
        <div className="space-y-2">
          <FieldLabel icon={ImageIcon} label="Image" />
          <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
            <div>
              <Label className="mb-1 text-xs text-muted-foreground">URL de l'image</Label>
              <Input
                value={block.url ?? ''}
                onChange={(e) => onUpdate({ url: e.target.value })}
                placeholder="https://…"
              />
            </div>
            <div>
              <Label className="mb-1 text-xs text-muted-foreground">Texte alternatif</Label>
              <Input
                value={block.alt ?? ''}
                onChange={(e) => onUpdate({ alt: e.target.value })}
                placeholder="Description de l'image"
              />
            </div>
          </div>
          {alignSelect}
        </div>
      )

    case 'divider':
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Minus className="size-4" />
          Séparateur horizontal — visuel dans l'e-mail.
        </div>
      )

    case 'list':
      return (
        <div className="space-y-2">
          <FieldLabel icon={List} label="Liste à puces" onInsertVariable={onInsertVariable} />
          {Array.isArray(block.items) && block.items.length > 0 ? (
            <div className="space-y-1.5">
              {block.items.map((it, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">{i + 1}.</span>
                  <Input
                    value={it}
                    onChange={(e) => {
                      const items = block.items!.slice()
                      items[i] = e.target.value
                      onUpdate({ items })
                    }}
                    placeholder="Élément de liste"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-7 shrink-0 text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      const items = block.items!.filter((_, j) => j !== i)
                      onUpdate({ items })
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Aucun élément.</p>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => onUpdate({ items: [...(block.items ?? []), 'Nouvel élément'] })}
          >
            <Plus className="size-3.5" />
            Ajouter un élément
          </Button>
          {alignSelect}
        </div>
      )

    default:
      return null
  }
}

function FieldLabel({
  icon: Icon,
  label,
  onInsertVariable,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onInsertVariable?: (token: string) => void
}) {
  if (!onInsertVariable) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
    )
  }
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs">
            <Variable className="size-3" />
            Variable
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {VARIABLE_TOKENS.map((v) => (
            <DropdownMenuItem
              key={v.token}
              onClick={() => onInsertVariable(v.token)}
              className="flex items-center justify-between"
            >
              <span>{v.label}</span>
              <code className="text-[10px] text-muted-foreground">{v.token}</code>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="size-7 cursor-pointer rounded-md border border-input bg-background p-1"
      />
    </label>
  )
}

/* -------------------------------- Helpers --------------------------------- */

function labelForType(type: BlockType): string {
  switch (type) {
    case 'title': return 'Titre'
    case 'text': return 'Texte'
    case 'button': return 'Bouton'
    case 'image': return 'Image'
    case 'divider': return 'Séparateur'
    case 'list': return 'Liste'
    default: return 'Bloc'
  }
}

// Substitution helper is exported via types.ts; this wrapper is for future use.
export function previewText(text: string) {
  return substituteVariables(text)
}
