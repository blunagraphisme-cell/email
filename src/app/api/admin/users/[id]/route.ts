/**
 * DELETE /api/admin/users/[id] — Platform Admin deletes a user account.
 *
 * Cascade deletes: sessions, workspace memberships, support tickets.
 * SetNull: audit logs (userId), API keys (createdById).
 * Workspaces are NOT deleted (they stay for data retention).
 *
 * Safety: admin cannot delete their own account.
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requirePlatformAdmin, ok, fail } from '@/lib/api'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requirePlatformAdmin()
  if (error) return error
  const { id } = await params

  // Prevent self-deletion
  if (id === ctx.user.id) {
    return fail('SELF_DELETE', 'Vous ne pouvez pas supprimer votre propre compte admin.', 400)
  }

  const user = await db.user.findUnique({ where: { id } })
  if (!user) return fail('NOT_FOUND', 'Utilisateur introuvable.', 404)

  // Store email for audit log before deletion
  const userEmail = user.email

  // Delete the user — cascades to: sessions, workspace_members, support_tickets
  // Audit logs + API keys have onDelete: SetNull on userId
  await db.user.delete({ where: { id } })

  // Audit log (use admin's workspace context or empty string)
  await db.auditLog.create({
    data: {
      workspaceId: '',
      userId: ctx.user.id,
      action: 'USER_DELETED',
      entityType: 'User',
      entityId: id,
      metadata: JSON.stringify({ deletedEmail: userEmail }),
    },
  }).catch(() => {})

  return ok({ deleted: true, email: userEmail })
}
