/**
 * MailOqui — Email editor shared types
 *
 * The `content` of a campaign (or template) is a JSON array of blocks.
 * Each block describes a piece of the email body. Variables inside `text`
 * are substituted at render time with the recipient's data.
 *
 * Supported variables: {{prenom}}, {{nom}}, {{email}}, {{entreprise}}.
 */

export type BlockType =
  | 'title'
  | 'text'
  | 'button'
  | 'image'
  | 'divider'
  | 'list'

export type BlockAlign = 'left' | 'center' | 'right'

export interface Block {
  id: string
  type: BlockType
  text?: string
  url?: string
  alt?: string
  items?: string[]
  align?: BlockAlign
  color?: string
  bg?: string
}

export interface SampleData {
  prenom: string
  nom: string
  email: string
  entreprise: string
}

export const DEFAULT_SAMPLE_DATA: SampleData = {
  prenom: 'Awa',
  nom: 'Agbode',
  email: 'awa@example.com',
  entreprise: 'OquiTogo',
}

export const VARIABLE_TOKENS: { token: string; label: string; key: keyof SampleData }[] = [
  { token: '{{prenom}}', label: 'Prénom', key: 'prenom' },
  { token: '{{nom}}', label: 'Nom', key: 'nom' },
  { token: '{{email}}', label: 'E-mail', key: 'email' },
  { token: '{{entreprise}}', label: 'Entreprise', key: 'entreprise' },
]

/** Generate a pseudo-unique block id (client-side only — not used server-side). */
export function makeBlockId(): string {
  return `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** Factory that returns a fresh block of the given type with sensible defaults. */
export function createBlock(type: BlockType): Block {
  const id = makeBlockId()
  switch (type) {
    case 'title':
      return { id, type, text: 'Nouveau titre', align: 'left' }
    case 'text':
      return {
        id,
        type,
        text: 'Saisissez votre texte ici. Utilisez {{prenom}} pour personnaliser.',
        align: 'left',
      }
    case 'button':
      return {
        id,
        type,
        text: 'Mon bouton',
        url: 'https://oquitogo.com',
        align: 'center',
      }
    case 'image':
      return {
        id,
        type,
        url: 'https://placehold.co/600x200/f59e0b/ffffff?text=Image',
        alt: 'Image descriptive',
        align: 'center',
      }
    case 'divider':
      return { id, type }
    case 'list':
      return { id, type, items: ['Premier élément', 'Deuxième élément', 'Troisième élément'], align: 'left' }
    default:
      return { id, type: 'text', text: '' }
  }
}

/** Replace {{var}} tokens with values from sample data. */
export function substituteVariables(text: string, data: SampleData = DEFAULT_SAMPLE_DATA): string {
  if (!text) return ''
  return text
    .replace(/\{\{prenom\}\}/g, data.prenom)
    .replace(/\{\{nom\}\}/g, data.nom)
    .replace(/\{\{email\}\}/g, data.email)
    .replace(/\{\{entreprise\}\}/g, data.entreprise)
}

/** Type guard that validates an unknown payload coming from an API. */
export function parseBlocks(raw: unknown): Block[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((b: any) => normalizeBlock(b))
    .filter((b: Block | null): b is Block => b !== null)
}

function normalizeBlock(b: any): Block | null {
  if (!b || typeof b !== 'object' || !b.type) return null
  const allowed: BlockType[] = ['title', 'text', 'button', 'image', 'divider', 'list']
  if (!allowed.includes(b.type)) return null
  const block: Block = {
    id: typeof b.id === 'string' ? b.id : makeBlockId(),
    type: b.type as BlockType,
  }
  if (typeof b.text === 'string') block.text = b.text
  if (typeof b.url === 'string') block.url = b.url
  if (typeof b.alt === 'string') block.alt = b.alt
  if (Array.isArray(b.items)) block.items = b.items.filter((x: any) => typeof x === 'string')
  if (b.align === 'left' || b.align === 'center' || b.align === 'right') block.align = b.align
  if (typeof b.color === 'string') block.color = b.color
  if (typeof b.bg === 'string') block.bg = b.bg
  return block
}
