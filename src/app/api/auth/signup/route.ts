/**
 * POST /api/auth/signup
 * Body: { email, password, firstName, lastName, workspaceName, planCode?, inviteToken? }
 *
 * If inviteToken is present:
 *   - Validates the invitation (token hash + status + expiry + email match)
 *   - Creates the user (NO new workspace, NO new subscription)
 *   - Accepts the invitation → creates WorkspaceMember (role=OWNER) in the invited workspace
 *   - Returns the invited workspace (so the new owner lands in the right place)
 *
 * If no inviteToken:
 *   - Creates: User (Developer), Workspace, WorkspaceMember, Subscription (EN_ATTENTE)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  hashPassword,
  createSession,
  setSessionCookie,
  addMonthsCal,
  hashToken,
} from '@/lib/auth'
import { z } from 'zod'

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  workspaceName: z.string().min(2).optional(),
  planCode: z.enum([
    'STARTER_3M', 'STARTER_6M', 'STARTER_1Y',
    'BUSINESS_3M', 'BUSINESS_6M', 'BUSINESS_1Y',
    'PREMIUM_3M', 'PREMIUM_6M', 'PREMIUM_1Y',
  ]).default('STARTER_3M'),
  inviteToken: z.string().optional(),
})

export async function POST(req: NextRequest) {
  let parsed
  try {
    parsed = Body.parse(await req.json())
  } catch (e: any) {
    return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Données invalides', details: e?.errors } }, { status: 400 })
  }

  const existing = await db.user.findUnique({ where: { email: parsed.email.toLowerCase() } })
  if (existing) {
    return NextResponse.json({ success: false, error: { code: 'EMAIL_EXISTS', message: 'Cet e-mail est déjà utilisé.' } }, { status: 409 })
  }

  // -------- Signup via invitation --------
  if (parsed.inviteToken) {
    const tokenHash = hashToken(parsed.inviteToken)
    const invitation = await db.invitation.findUnique({
      where: { tokenHash },
      include: { workspace: { include: { subscriptions: { include: { plan: true }, orderBy: { createdAt: 'desc' }, take: 1 } } } },
    })

    if (!invitation) {
      return NextResponse.json({ success: false, error: { code: 'INVITE_NOT_FOUND', message: 'Invitation introuvable ou token invalide.' } }, { status: 404 })
    }
    if (invitation.status !== 'EN_ATTENTE') {
      return NextResponse.json({ success: false, error: { code: 'INVITE_USED', message: `Invitation ${invitation.status.toLowerCase()}.` } }, { status: 400 })
    }
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: { code: 'INVITE_EXPIRED', message: 'Invitation expirée.' } }, { status: 400 })
    }
    if (invitation.email !== parsed.email.toLowerCase()) {
      return NextResponse.json({ success: false, error: { code: 'EMAIL_MISMATCH', message: `Cette invitation est pour ${invitation.email}.` } }, { status: 403 })
    }

    // Create user
    const user = await db.user.create({
      data: {
        email: parsed.email.toLowerCase(),
        firstName: parsed.firstName || null,
        lastName: parsed.lastName || null,
        passwordHash: hashPassword(parsed.password),
        emailVerified: false,
        role: 'USER',
      },
    })

    // Accept invitation → create membership in invited workspace
    await db.workspaceMember.create({
      data: {
        workspaceId: invitation.workspaceId,
        userId: user.id,
        role: invitation.role, // 'OWNER'
        status: 'ACTIF',
        invitedBy: user.id,
      },
    })

    // Mark invitation accepted
    await db.invitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTEE', acceptedAt: new Date() },
    })

    await db.auditLog.create({
      data: { workspaceId: invitation.workspaceId, userId: user.id, action: 'INVITATION_ACCEPTED', entityType: 'Invitation', entityId: invitation.id, metadata: JSON.stringify({ email: invitation.email, role: invitation.role, via: 'signup' }) },
    })

    const token = await createSession(user.id)
    await setSessionCookie(token)

    const ws = invitation.workspace
    const sub = ws.subscriptions[0]
    const plan = sub?.plan

    return NextResponse.json({
      success: true,
      user: {
        id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, emailVerified: user.emailVerified,
      },
      workspace: {
        id: ws.id, name: ws.name, status: ws.status, timezone: ws.timezone,
        memberRole: invitation.role,
        planCode: plan?.code ?? null, planName: plan?.name ?? null,
        subscriptionStatus: sub?.status ?? null,
        subscriptionEnd: sub?.endDate ? new Date(sub.endDate).toISOString() : null,
        dailyEmailLimit: plan ? Number(plan.dailyEmailLimit) : 0, emailsSentToday: 0,
      },
    })
  }

  // -------- Normal signup (no invitation) --------
  const plan = await db.plan.findUnique({ where: { code: parsed.planCode } })
  if (!plan) {
    return NextResponse.json({ success: false, error: { code: 'PLAN_NOT_FOUND', message: 'Plan introuvable.' } }, { status: 400 })
  }

  const user = await db.user.create({
    data: {
      email: parsed.email.toLowerCase(),
      firstName: parsed.firstName || null,
      lastName: parsed.lastName || null,
      passwordHash: hashPassword(parsed.password),
      emailVerified: false,
      role: 'USER',
    },
  })

  const workspace = await db.workspace.create({
    data: {
      name: parsed.workspaceName ?? 'Mon Entreprise',
      status: 'ACTIF',
      timezone: 'Africa/Lome',
    },
  })

  await db.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId: user.id,
      role: 'DEVELOPER',
      status: 'ACTIF',
      invitedBy: user.id,
    },
  })

  const startDate = new Date()
  const endDate = addMonthsCal(startDate, plan.durationMonths)
  const sub = await db.subscription.create({
    data: {
      workspaceId: workspace.id,
      planId: plan.id,
      status: 'EN_ATTENTE',
      startDate,
      endDate,
    },
  })

  await db.auditLog.create({
    data: { workspaceId: workspace.id, userId: user.id, action: 'WORKSPACE_CREATED', entityType: 'Workspace', entityId: workspace.id, metadata: JSON.stringify({ name: workspace.name, planCode: plan.code }) },
  })

  const token = await createSession(user.id)
  await setSessionCookie(token)

  return NextResponse.json({
    success: true,
    user: {
      id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, emailVerified: user.emailVerified,
    },
    workspace: {
      id: workspace.id, name: workspace.name, status: workspace.status, timezone: workspace.timezone,
      memberRole: 'DEVELOPER', planCode: plan.code, planName: plan.name,
      subscriptionStatus: sub.status, subscriptionEnd: endDate.toISOString(),
      dailyEmailLimit: plan.dailyEmailLimit, emailsSentToday: 0,
    },
  })
}
