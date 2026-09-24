/**
 * GET /api/auth/me — récupère l'utilisateur courant + workspace actif.
 * Auto-accepte les invitations en attente pour l'e-mail de l'utilisateur
 * (utile quand l'utilisateur est déjà connecté via cookie de session).
 */
import { NextResponse } from 'next/server'
import { getSecurityContext } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const ctx = await getSecurityContext()
  if (!ctx || !ctx.user) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Non connecté' } }, { status: 401 })
  }

  // Auto-accept pending invitations for this user's email
  // This ensures invitations are accepted even if the user is already logged in
  // (via cookie) and never went through the login form
  const pendingInvites = await db.invitation.findMany({
    where: { email: ctx.user.email.toLowerCase(), status: 'EN_ATTENTE' },
  })
  let invitesAccepted = 0
  for (const inv of pendingInvites) {
    // Check if already a member of this workspace
    const existing = await db.workspaceMember.findFirst({
      where: { workspaceId: inv.workspaceId, userId: ctx.user.id },
    })
    if (!existing) {
      await db.workspaceMember.create({
        data: {
          workspaceId: inv.workspaceId,
          userId: ctx.user.id,
          role: inv.role,
          status: 'ACTIF',
          invitedBy: ctx.user.id,
        },
      })
    }
    await db.invitation.update({
      where: { id: inv.id },
      data: { status: 'ACCEPTEE', acceptedAt: new Date() },
    })
    invitesAccepted++
  }

  // If invitations were just accepted, re-fetch the security context
  // to get the updated workspace (OWNER membership)
  if (invitesAccepted > 0) {
    const updatedCtx = await getSecurityContext()
    if (updatedCtx?.workspace) {
      ctx.workspace = updatedCtx.workspace
      ctx.membership = updatedCtx.membership
      ctx.subscription = updatedCtx.subscription
      ctx.plan = updatedCtx.plan
      ctx.role = updatedCtx.role
    }
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
