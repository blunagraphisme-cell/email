/**
 * PATCH /api/admin/subscriptions/[id] — Platform Admin modifies a subscription.
 *
 * Body: { endDate?, startDate?, status?, planId? }
 *
 * Allows the admin to change the subscription period (extend, shorten, etc.)
 * or the status (ACTIF, EXPIRE, SUSPENDU, etc.) or the plan.
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requirePlatformAdmin, ok, fail } from '@/lib/api'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requirePlatformAdmin()
  if (error) return error
  const { id } = await params

  const sub = await db.subscription.findUnique({
    where: { id },
    include: { workspace: true, plan: true },
  })
  if (!sub) return fail('NOT_FOUND', 'Abonnement introuvable.', 404)

  const body = await req.json().catch(() => ({}))
  const data: any = {}

  if (body.endDate) {
    const newEnd = new Date(body.endDate)
    if (isNaN(newEnd.getTime())) return fail('INVALID_DATE', 'Date de fin invalide.', 400)
    data.endDate = newEnd
  }

  if (body.startDate) {
    const newStart = new Date(body.startDate)
    if (isNaN(newStart.getTime())) return fail('INVALID_DATE', 'Date de début invalide.', 400)
    data.startDate = newStart
  }

  if (body.status) {
    const validStatuses = ['EN_ATTENTE', 'ACTIF', 'EXPIRANT_BIENTOT', 'EXPIRE', 'SUSPENDU', 'ANNULE']
    if (!validStatuses.includes(body.status)) {
      return fail('INVALID_STATUS', `Statut invalide. Valides: ${validStatuses.join(', ')}`, 400)
    }
    data.status = body.status
  }

  if (body.planCode) {
    const plan = await db.plan.findUnique({ where: { code: body.planCode } })
    if (!plan) return fail('PLAN_NOT_FOUND', 'Plan introuvable.', 400)
    data.planId = plan.id
  }

  if (Object.keys(data).length === 0) {
    return fail('EMPTY', 'Aucune modification fournie.', 400)
  }

  const updated = await db.subscription.update({
    where: { id },
    data,
    include: { plan: true, workspace: true },
  })

  await db.auditLog.create({
    data: {
      workspaceId: updated.workspaceId,
      userId: ctx.user.id,
      action: 'SUBSCRIPTION_MODIFIED',
      entityType: 'Subscription',
      entityId: updated.id,
      metadata: JSON.stringify({
        workspace: updated.workspace.name,
        oldEndDate: sub.endDate?.toISOString(),
        newEndDate: updated.endDate?.toISOString(),
        status: data.status ?? sub.status,
      }),
    },
  }).catch(() => {})

  return ok({
    subscription: {
      id: updated.id,
      workspaceName: updated.workspace.name,
      status: updated.status,
      startDate: updated.startDate?.toISOString() ?? null,
      endDate: updated.endDate?.toISOString() ?? null,
      planCode: updated.plan?.code ?? null,
      planName: updated.plan?.name ?? null,
    },
  })
}
