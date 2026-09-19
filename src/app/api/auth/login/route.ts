/**
 * POST /api/auth/login
 * Body: { email, password }
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createSession, setSessionCookie } from '@/lib/auth'
import { z } from 'zod'

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  let parsed
  try {
    parsed = Body.parse(await req.json())
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'E-mail ou mot de passe invalide.' } }, { status: 400 })
  }

  const user = await db.user.findUnique({ where: { email: parsed.email.toLowerCase() } })
  if (!user || !user.passwordHash) {
    return NextResponse.json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'E-mail ou mot de passe incorrect.' } }, { status: 401 })
  }
  if (user.status !== 'ACTIF') {
    return NextResponse.json({ success: false, error: { code: 'ACCOUNT_SUSPENDED', message: 'Compte suspendu. Contactez le support.' } }, { status: 403 })
  }

  if (!verifyPassword(parsed.password, user.passwordHash)) {
    return NextResponse.json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'E-mail ou mot de passe incorrect.' } }, { status: 401 })
  }

  const token = await createSession(user.id)
  await setSessionCookie(token)

  await db.auditLog.create({
    data: { userId: user.id, workspaceId: '', action: 'LOGIN', entityType: 'User', entityId: user.id, metadata: '{}' },
  }).catch(() => {})

  return NextResponse.json({ success: true, user: {
    id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, emailVerified: user.emailVerified,
  } })
}
