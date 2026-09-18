/**
 * GET  /api/campaigns — liste les campagnes du workspace courant
 * POST /api/campaigns — crée une campagne (brouillon)
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireDeveloper, ok, fail } from '@/lib/api'
import { z } from 'zod'

export async function GET() {
  const { ctx, error } = await requireDeveloper()
  if (error) return error
  const items = await db.campaign.findMany({
    where: { workspaceId: ctx.workspace.id },
    orderBy: { createdAt: 'desc' },
  })
  // stats per campaign
  const withStats = await Promise.all(items.map(async (c) => {
    const events = await db.emailEvent.groupBy({
      by: ['eventType'],
      where: { campaignId: c.id },
      _count: { _all: true },
    })
    const counts: Record<string, number> = {}
    for (const e of events) counts[e.eventType] = e._count._all
    return {
      ...c,
      sent: counts.SENT ?? 0,
      delivered: counts.DELIVERED ?? 0,
      opened: counts.OPENED ?? 0,
      clicked: counts.CLICKED ?? 0,
      bounced: counts.BOUNCE ?? 0,
      failed: counts.FAILED ?? 0,
      unsubscribed: counts.UNSUBSCRIBE ?? 0,
    }
  }))
  return ok({ campaigns: withStats })
}

const Create = z.object({
  name: z.string().min(2),
  subject: z.string().optional(),
  fromName: z.string().optional(),
  fromEmail: z.string().email().optional(),
  content: z.any().optional(),
})

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireDeveloper()
  if (error) return error
  let parsed
  try { parsed = Create.parse(await req.json()) } catch (e: any) {
    return fail('INVALID_INPUT', 'Données invalides', 400)
  }
  const c = await db.campaign.create({
    data: {
      workspaceId: ctx.workspace.id,
      name: parsed.name,
      subject: parsed.subject ?? '',
      fromName: parsed.fromName ?? null,
      fromEmail: parsed.fromEmail ?? null,
      content: parsed.content ? JSON.stringify(parsed.content) : null,
      status: 'BROUILLON',
    },
  })
  await db.auditLog.create({
    data: { workspaceId: ctx.workspace.id, userId: ctx.user.id, action: 'CAMPAIGN_CREATED', entityType: 'Campaign', entityId: c.id, metadata: JSON.stringify({ name: c.name }) },
  })
  return ok({ campaign: c })
}
