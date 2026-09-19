/**
 * GET /api/workspace/members — list all members of the current workspace.
 * DELETE /api/workspace/members?userId=... — developer removes a member (owner) from the workspace.
 *
 * Only DEVELOPER can list/remove members. Owners can't manage members.
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireDeveloper, ok, fail } from '@/lib/api'

export async function GET() {
  const { ctx, error } = await requireDeveloper()
  if (error) return error

  const members = await db.workspaceMember.findMany({
    where: { workspaceId: ctx.workspace.id },
    include: { user: { select: { id: true, email: true, firstName: true, lastName: true, emailVerified: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return ok({
    members: members.map((m) => ({
      id: m.id,
      userId: m.userId,
      email: m.user.email,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      role: m.role,
      status: m.status,
      emailVerified: m.user.emailVerified,
      createdAt: m.createdAt.toISOString(),
    })),
  })
}

export async function DELETE(req: NextRequest) {
  const { ctx, error } = await requireDeveloper()
  if (error) return error

  const url = new URL(req.url)
  const userId = url.searchParams.get('userId')
  if (!userId) return fail('INVALID_INPUT', 'userId requis.', 400)

  // Can't remove yourself
  if (userId === ctx.user.id) {
    return fail('SELF_REMOVE', 'Vous ne pouvez pas vous retirer du workspace.', 400)
  }

  const member = await db.workspaceMember.findFirst({
    where: { workspaceId: ctx.workspace.id, userId },
  })
  if (!member) return fail('NOT_FOUND', 'Membre introuvable dans ce workspace.', 404)

  // Delete the membership (the user keeps their account, just loses access to this workspace)
  await db.workspaceMember.delete({ where: { id: member.id } })

  // Also cancel any pending invitations for this email
  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } })
  if (user) {
    await db.invitation.updateMany({
      where: { workspaceId: ctx.workspace.id, email: user.email, status: 'EN_ATTENTE' },
      data: { status: 'ANNULE' },
    })
  }

  await db.auditLog.create({
    data: {
      workspaceId: ctx.workspace.id,
      userId: ctx.user.id,
      action: 'OWNER_REMOVED',
      entityType: 'WorkspaceMember',
      entityId: member.id,
      metadata: JSON.stringify({ removedEmail: user?.email }),
    },
  }).catch(() => {})

  return ok({ removed: true, email: user?.email })
}
