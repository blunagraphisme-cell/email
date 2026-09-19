/**
 * GET  /api/invitations — list invitations for the current workspace (Developer only)
 * POST /api/invitations — create a new invitation (Developer invites Owner by email)
 *    Body: { email }
 *    Generates a token (random 24 bytes), stores the hash, expires in 7 days.
 *    Returns the raw token (one-time display) + the invitation link.
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireDeveloper, ok, fail } from '@/lib/api'
import { randomToken, hashToken } from '@/lib/auth'
import { getBaseUrl } from '@/lib/url'

const INVITE_TTL_DAYS = 7

export async function GET() {
  const { ctx, error } = await requireDeveloper()
  if (error) return error
  const items = await db.invitation.findMany({
    where: { workspaceId: ctx.workspace.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return ok({
    invitations: items.map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      status: i.status,
      expiresAt: i.expiresAt.toISOString(),
      acceptedAt: i.acceptedAt?.toISOString() ?? null,
      createdAt: i.createdAt.toISOString(),
    })),
  })
}

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireDeveloper()
  if (error) return error
  const body = await req.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail('INVALID_EMAIL', 'E-mail du propriétaire invalide.', 400)
  }

  // Check if already a member
  const existingMember = await db.workspaceMember.findFirst({
    where: { workspaceId: ctx.workspace.id, user: { email } },
  })
  if (existingMember) {
    return fail('ALREADY_MEMBER', 'Cet e-mail est déjà membre du workspace.', 409)
  }

  // Check if there's already an active invitation for this email
  const existingInvite = await db.invitation.findFirst({
    where: { workspaceId: ctx.workspace.id, email, status: 'EN_ATTENTE' },
  })
  if (existingInvite) {
    return fail('INVITE_EXISTS', 'Une invitation active existe déjà pour cet e-mail.', 409)
  }

  const rawToken = randomToken(24)
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000)

  const invitation = await db.invitation.create({
    data: {
      workspaceId: ctx.workspace.id,
      email,
      role: 'OWNER',
      tokenHash,
      expiresAt,
      status: 'EN_ATTENTE',
      createdById: ctx.user.id,
    },
  })

  // Build the invitation link (uses the current host so it works in dev + prod)
  const baseUrl = getBaseUrl(req.headers)
  const inviteUrl = `${baseUrl}/?invite=${rawToken}`

  await db.auditLog.create({
    data: {
      workspaceId: ctx.workspace.id,
      userId: ctx.user.id,
      action: 'OWNER_INVITED',
      entityType: 'Invitation',
      entityId: invitation.id,
      metadata: JSON.stringify({ email }),
    },
  })

  return ok({
    invitation: {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt.toISOString(),
      createdAt: invitation.createdAt.toISOString(),
    },
    token: rawToken, // shown ONCE to the developer
    inviteUrl,
  })
}

export async function DELETE(req: NextRequest) {
  const { ctx, error } = await requireDeveloper()
  if (error) return error
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return fail('INVALID_INPUT', 'id requis.', 400)
  await db.invitation.updateMany({
    where: { id, workspaceId: ctx.workspace.id, status: 'EN_ATTENTE' },
    data: { status: 'ANNULE' },
  })
  return ok({})
}
