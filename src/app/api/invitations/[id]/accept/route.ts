/**
 * POST /api/invitations/[id]/accept — accept an invitation (authed user).
 *
 * Body: { token }
 *
 * Validates:
 *  1. The token matches the invitation (hash)
 *  2. The invitation is still EN_ATTENTE and not expired
 *  3. The authenticated user's email matches the invitation email
 *
 * Creates a WorkspaceMember (role OWNER) + marks invitation ACCEPTEE.
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, ok, fail } from '@/lib/api'
import { hashToken } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requireAuth()
  if (error) return error
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const token = typeof body.token === 'string' ? body.token.trim() : ''
  if (!token) return fail('INVALID_INPUT', 'Token requis.', 400)

  const tokenHash = hashToken(token)
  const invitation = await db.invitation.findFirst({
    where: { id, tokenHash },
  })
  if (!invitation) return fail('NOT_FOUND', 'Invitation introuvable ou token invalide.', 404)
  if (invitation.status !== 'EN_ATTENTE') return fail('INVALID_STATE', `Invitation ${invitation.status.toLowerCase()}.`, 400)
  if (invitation.expiresAt < new Date()) return fail('EXPIRED', 'Invitation expirée.', 400)

  // The authenticated user's email must match the invitation email
  if (ctx.user.email !== invitation.email) {
    return fail('EMAIL_MISMATCH', `Cette invitation est pour ${invitation.email}. Vous êtes connecté en tant que ${ctx.user.email}.`, 403)
  }

  // Check if already a member of this workspace
  const existingMember = await db.workspaceMember.findFirst({
    where: { workspaceId: invitation.workspaceId, userId: ctx.user.id },
  })
  if (existingMember) {
    // Already a member — just mark invitation as accepted
    await db.invitation.update({ where: { id }, data: { status: 'ACCEPTEE', acceptedAt: new Date() } })
    return ok({ alreadyMember: true, workspaceId: invitation.workspaceId })
  }

  // Create the membership
  await db.workspaceMember.create({
    data: {
      workspaceId: invitation.workspaceId,
      userId: ctx.user.id,
      role: invitation.role, // 'OWNER'
      status: 'ACTIF',
      invitedBy: ctx.user.id,
    },
  })

  // Mark invitation accepted
  await db.invitation.update({
    where: { id },
    data: { status: 'ACCEPTEE', acceptedAt: new Date() },
  })

  await db.auditLog.create({
    data: {
      workspaceId: invitation.workspaceId,
      userId: ctx.user.id,
      action: 'INVITATION_ACCEPTED',
      entityType: 'Invitation',
      entityId: invitation.id,
      metadata: JSON.stringify({ email: invitation.email, role: invitation.role }),
    },
  })

  return ok({
    accepted: true,
    workspaceId: invitation.workspaceId,
    role: invitation.role,
  })
}
