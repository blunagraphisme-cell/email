/**
 * GET /api/auth/me — récupère l'utilisateur courant + workspace actif
 */
import { NextResponse } from 'next/server'
import { getSecurityContext } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const ctx = await getSecurityContext()
  if (!ctx || !ctx.user) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Non connecté' } }, { status: 401 })
  }
  if (!ctx.workspace) {
    return NextResponse.json({
      success: true,
      user: {
        id: ctx.user.id,
        email: ctx.user.email,
        firstName: ctx.user.firstName,
        lastName: ctx.user.lastName,
        role: ctx.user.role,
        emailVerified: ctx.user.emailVerified,
      },
      workspace: null,
    })
  }
  const plan = ctx.plan
  const sub = ctx.subscription
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const quota = await db.quotaUsage.findUnique({
    where: { workspaceId_date: { workspaceId: ctx.workspace.id, date: today } },
  })
  return NextResponse.json({
    success: true,
    user: {
      id: ctx.user.id,
      email: ctx.user.email,
      firstName: ctx.user.firstName,
      lastName: ctx.user.lastName,
      role: ctx.user.role,
      emailVerified: ctx.user.emailVerified,
    },
    workspace: {
      id: ctx.workspace.id,
      name: ctx.workspace.name,
      status: ctx.workspace.status,
      timezone: ctx.workspace.timezone,
      memberRole: ctx.membership?.role,
      planCode: plan?.code,
      planName: plan?.name,
      subscriptionStatus: sub?.status,
      subscriptionEnd: sub?.endDate ? new Date(sub.endDate).toISOString() : null,
      dailyEmailLimit: plan ? Number(plan.dailyEmailLimit) : 0,
      emailsSentToday: quota?.emailsSent ?? 0,
    },
  })
}
