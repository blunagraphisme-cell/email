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

  // Send invitation email via Resend (if configured)
  let emailSent = false
  let emailError: string | null = null
  try {
    const { Resend } = await import('resend')
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      const resend = new Resend(resendKey)
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'no-reply@email.oquitogo.online'
      const inviterName = [ctx.user.firstName, ctx.user.lastName].filter(Boolean).join(' ') || ctx.user.email

      const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#000;padding:16px 24px;">
            <img src="${baseUrl}/logo.png" alt="EmailOqui" width="28" height="28" style="display:inline-block;vertical-align:middle;border-radius:6px;background:#fff;padding:2px;" />
            <span style="margin-left:8px;font-size:16px;font-weight:600;color:#fff;vertical-align:middle;">EmailOqui</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 24px;">
            <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1a1a;">Invitation à rejoindre ${ctx.workspace.name}</h1>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">
              Bonjour,<br><br>
              <strong>${inviterName}</strong> vous invite à rejoindre le workspace
              <strong>${ctx.workspace.name}</strong> sur EmailOqui en tant que propriétaire.<br><br>
              Vous aurez accès à votre tableau de bord avec les statistiques de vos communications e-mail.
            </p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${inviteUrl}" style="display:inline-block;padding:14px 32px;background:#000;color:#fff;text-decoration:none;font-weight:600;border-radius:8px;font-size:15px;">
                Accepter l'invitation
              </a>
            </div>
            <p style="margin:16px 0 0;font-size:13px;color:#6b7280;">
              Ou copiez ce lien :<br>
              <span style="font-family:monospace;font-size:12px;color:#374151;word-break:break-all;">${inviteUrl}</span><br><br>
              Ce lien expire dans 7 jours.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 24px;border-top:1px solid #e5e7eb;background:#f9fafb;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              © ${new Date().getFullYear()} EmailOqui — email.oquitogo.online<br>
              Si vous n'attendiez pas cette invitation, ignorez cet e-mail.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

      const { error: sendError } = await resend.emails.send({
        from: `EmailOqui <${fromEmail}>`,
        to: email,
        subject: `Invitation à rejoindre ${ctx.workspace.name} sur EmailOqui`,
        html,
        tags: [{ name: 'source', value: 'emailoqui-invitation' }],
      })

      if (sendError) {
        emailError = sendError.message
      } else {
        emailSent = true
      }
    } else {
      emailError = 'RESEND_API_KEY not configured'
    }
  } catch (e: any) {
    emailError = e?.message ?? 'unknown error'
  }

  await db.auditLog.create({
    data: {
      workspaceId: ctx.workspace.id,
      userId: ctx.user.id,
      action: 'OWNER_INVITED',
      entityType: 'Invitation',
      entityId: invitation.id,
      metadata: JSON.stringify({ email, emailSent, emailError }),
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
    token: rawToken,
    inviteUrl,
    emailSent,
    emailError,
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
