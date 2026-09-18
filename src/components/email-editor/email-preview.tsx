'use client'

/**
 * EmailOqui — Email preview component
 *
 * Renders an array of `Block`s into a static HTML e-mail layout (no client
 * interactivity). Used inside the editor (right pane) and the campaign detail
 * page's "Aperçu de l'e-mail" section. Variables {{prenom}} etc. are
 * substituted with `sampleData` (default demo: Awa / Agbode / awa@example.com /
 * OquiTogo).
 */
import * as React from 'react'
import { Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  type Block,
  type SampleData,
  DEFAULT_SAMPLE_DATA,
  substituteVariables,
} from './types'

export interface EmailPreviewProps {
  blocks: Block[]
  sampleData?: Partial<SampleData>
  /** Override workspace name shown in the email header (defaults to "Mon Entreprise"). */
  workspaceName?: string
  /** Compact mode used inside editor side pane — removes outer card chrome. */
  compact?: boolean
  className?: string
}

const ALIGN_CLASS: Record<NonNullable<Block['align']>, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

function resolveAlign(b: Block): NonNullable<Block['align']> {
  return b.align ?? 'left'
}

function alignWrapper(b: Block, children: React.ReactNode) {
  return (
    <div className={cn('w-full', ALIGN_CLASS[resolveAlign(b)])}>{children}</div>
  )
}

export function EmailPreview({
  blocks,
  sampleData,
  workspaceName = 'Mon Entreprise',
  compact = false,
  className,
}: EmailPreviewProps) {
  const data: SampleData = { ...DEFAULT_SAMPLE_DATA, ...sampleData }

  const body = (
    <div className="bg-white text-[0.95rem] leading-relaxed text-slate-800">
      {blocks.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-slate-400">
          Aucun contenu. Ajoutez des blocs dans l'éditeur.
        </p>
      ) : (
        blocks.map((b) => <BlockRenderer key={b.id} block={b} data={data} />)
      )}
    </div>
  )

  if (compact) {
    return (
      <div
        className={cn(
          'mx-auto w-full max-w-2xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm',
          className
        )}
      >
        <EmailHeader workspaceName={workspaceName} compact />
        <div className="px-6 py-6">{body}</div>
        <EmailFooter workspaceName={workspaceName} compact />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'mx-auto w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-white shadow-sm',
        className
      )}
    >
      <EmailHeader workspaceName={workspaceName} />
      <div className="px-6 py-6">{body}</div>
      <EmailFooter workspaceName={workspaceName} />
    </div>
  )
}

export default EmailPreview

/* ------------------------------ Sub-components ----------------------------- */

function EmailHeader({ workspaceName, compact = false }: { workspaceName: string; compact?: boolean }) {
  return (
    <div
      className="flex items-center justify-between px-6 py-4 text-white"
      style={{ backgroundColor: '#f59e0b' }}
    >
      <div className="flex items-center gap-2">
        <img
          src="/logo.png"
          alt="EmailOqui"
          width={28}
          height={28}
          className="size-7 rounded-md bg-white/90 object-contain p-0.5"
        />
        <span className={cn('font-semibold tracking-tight', compact ? 'text-sm' : 'text-base')}>
          {workspaceName}
        </span>
      </div>
      <span className={cn('text-white/80', compact ? 'text-[10px]' : 'text-xs')}>
        email.oquitogo.com
      </span>
    </div>
  )
}

function EmailFooter({ workspaceName, compact = false }: { workspaceName: string; compact?: boolean }) {
  return (
    <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-center text-xs text-slate-500">
      <p>
        Cet e-mail vous a été envoyé par <strong className="font-medium text-slate-700">{workspaceName}</strong>.
      </p>
      <p className="mt-1">
        Vous recevez cet e-mail car vous faites partie de notre liste de contacts.{' '}
        <a
          href="#"
          className="font-medium text-amber-600 underline-offset-2 hover:underline"
          onClick={(e) => e.preventDefault()}
        >
          Se désabonner
        </a>
      </p>
      <p className={cn('mt-2 text-slate-400', compact ? 'text-[10px]' : 'text-[11px]')}>
        © {new Date().getFullYear()} {workspaceName} — Lomé, Togo
      </p>
    </div>
  )
}

/* ------------------------------ Block renderer ----------------------------- */

function BlockRenderer({ block, data }: { block: Block; data: SampleData }) {
  switch (block.type) {
    case 'title':
      return alignWrapper(
        block,
        <h2
          className="mb-3 mt-0 text-2xl font-bold tracking-tight"
          style={block.color ? { color: block.color } : undefined}
        >
          {substituteVariables(block.text ?? '', data)}
        </h2>
      )

    case 'text':
      return alignWrapper(
        block,
        <p
          className="my-2 whitespace-pre-line text-[0.95rem] leading-relaxed"
          style={block.color ? { color: block.color } : undefined}
        >
          {substituteVariables(block.text ?? '', data)}
        </p>
      )

    case 'button': {
      const btnBg = block.bg ?? '#f59e0b'
      const btnColor = block.color ?? '#ffffff'
      return (
        <div className={cn('my-4 w-full', ALIGN_CLASS[resolveAlign(block)])}>
          <span
            className="inline-block rounded-md px-6 py-3 text-sm font-semibold no-underline shadow-sm"
            style={{ backgroundColor: btnBg, color: btnColor }}
          >
            {substituteVariables(block.text ?? 'Cliquez', data)}
          </span>
          {block.url && (
            <p className="mt-1 text-[11px] text-slate-400">→ {block.url}</p>
          )}
        </div>
      )
    }

    case 'image':
      return alignWrapper(
        block,
        <div className="my-3">
          <img
            src={block.url ?? ''}
            alt={block.alt ?? 'Image'}
            className="mx-auto max-w-full rounded-lg"
            style={{ maxHeight: 320, objectFit: 'cover' }}
          />
          {block.alt && (
            <p className="mt-1 text-[11px] italic text-slate-400">{block.alt}</p>
          )}
        </div>
      )

    case 'divider':
      return <hr className="my-4 border-t border-slate-200" />

    case 'list': {
      const items = Array.isArray(block.items) ? block.items : []
      return alignWrapper(
        block,
        <ul className="my-3 list-disc space-y-1 pl-5 text-[0.95rem] leading-relaxed">
          {items.map((it, i) => (
            <li key={i}>{substituteVariables(it, data)}</li>
          ))}
        </ul>
      )
    }

    default:
      return null
  }
}
