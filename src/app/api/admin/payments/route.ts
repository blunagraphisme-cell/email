/**
 * GET /api/admin/payments — list all payments across all workspaces.
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requirePlatformAdmin, ok } from '@/lib/api'

export async function GET(req: NextRequest) {
  const { ctx, error } = await requirePlatformAdmin()
  if (error) return error

  const url = new URL(req.url)
  const limit = Math.min(200, Math.max(10, Number(url.searchParams.get('limit') ?? '50')))
  const status = url.searchParams.get('status') ?? ''

  const where: any = {}
  if (status) where.status = status

  const items = await db.payment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      workspace: { select: { name: true } },
      subscription: { include: { plan: true } },
    },
  })

  return ok({
    payments: items.map((p) => ({
      id: p.id,
      workspaceName: p.workspace.name,
      planCode: p.subscription.plan?.code ?? null,
      planName: p.subscription.plan?.name ?? null,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      transactionReference: p.transactionReference,
      paymentMethod: p.paymentMethod,
      cardLast4: p.cardLast4,
      confirmedAt: p.confirmedAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    })),
  })
}
