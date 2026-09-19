/**
 * GET /api/invitations/validate?token=... — validate an invitation token (public, no auth).
 *
 * Returns workspace info + inviter name so the client can display
 * "You're invited to workspace X by Y" before login/signup.
 *
 * Does NOT accept the invitation — that requires POST /api/invitations/[id]/accept
 * with an authenticated session.
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { hashToken } from '@/lib/auth'
import { ok, fail } from '@/lib/api'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')
  if (!token) return fail('INVALID_INPUT', 'Token requis.', 400)

  const tokenHash = hashToken(token)
  const invitation = await db.invitation.findUnique({
    where: { tokenHash },
    include: {
      workspace: { select: { name: true } },
      createdBy: { select: { firstName: true, lastName: true, email: true } },
    },
  })

  if (!invitation) return fail('NOT_FOUND', 'Invitation introuvable ou token invalide.', 404)
  if (invitation.status === 'ACCEPTEE') return fail('ALREADY_ACCEPTED', 'Cette invitation a déjà été acceptée.', 400)
  if (invitation.status === 'ANNULE') return fail('CANCELLED', 'Cette invitation a été annulée.', 400)
  if (invitation.expiresAt < new Date()) return fail('EXPIRED', 'Cette invitation a expiré.', 400)

  // Check if the user already has an account
  const existingUser = await db.user.findUnique({ where: { email: invitation.email } })

  return ok({
    invitation: {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      workspaceName: invitation.workspace.name,
      invitedBy: [invitation.createdBy?.firstName, invitation.createdBy?.lastName].filter(Boolean).join(' ') || invitation.createdBy?.email,
      expiresAt: invitation.expiresAt.toISOString(),
      hasAccount: !!existingUser,
    },
  })
}
