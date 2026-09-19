/**
 * POST /api/auth/signup
 * Body: { email, password, firstName, lastName, workspaceName, planCode? }
 *
 * Crée: User (Developer), Workspace, WorkspaceMember, Subscription (EN_ATTENTE)
 * Renvoie: user + workspace.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createSession, setSessionCookie, addMonthsCal, planLimit } from '@/lib/auth'
import { z } from 'zod'

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  workspaceName: z.string().min(2),
  planCode: z.enum([
    'STARTER_3M', 'STARTER_6M', 'STARTER_1Y',
    'BUSINESS_3M', 'BUSINESS_6M', 'BUSINESS_1Y',
    'PREMIUM_3M', 'PREMIUM_6M', 'PREMIUM_1Y',
  ]).default('STARTER_3M'),
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
      name: parsed.workspaceName,
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

  // Audit log
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
