/**
 * MailOqui — server-side auth & crypto helpers
 * Hashing mots de passe (scrypt), tokens aléatoires, sessions cookie.
 */

import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { db } from './db'

export const SESSION_COOKIE = 'mo_session'
const SESSION_TTL_DAYS = 7

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(':')
    if (!salt || !hash) return false
    const test = scryptSync(password, salt, 64).toString('hex')
    return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(test, 'hex'))
  } catch {
    return false
  }
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex')
}

export function hashToken(token: string): string {
  // SHA-256 single direction
  const { createHash } = require('crypto') as typeof import('crypto')
  return createHash('sha256').update(token).digest('hex')
}

export async function createSession(userId: string): Promise<string> {
  const token = randomToken(32)
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000)
  await db.session.create({ data: { userId, token, expiresAt } })
  return token
}

export async function setSessionCookie(token: string) {
  const c = await cookies()
  c.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  })
}

export async function clearSessionCookie() {
  const c = await cookies()
  c.delete(SESSION_COOKIE)
}

export async function getCurrentUser() {
  const c = await cookies()
  const token = c.get(SESSION_COOKIE)?.value
  if (!token) return null
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  })
  if (!session) return null
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } })
    return null
  }
  return session.user
}

export async function getActiveWorkspace(userId: string) {
  // Récupère le workspace d'appartenance actif de l'utilisateur
  const membership = await db.workspaceMember.findFirst({
    where: { userId, status: 'ACTIF' },
    include: {
      workspace: {
        include: {
          subscriptions: {
            include: { plan: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          domain: true,
        },
      },
    },
  })
  if (!membership) return null
  const ws = membership.workspace
  const sub = ws.subscriptions[0]
  return {
    membership,
    workspace: ws,
    subscription: sub ?? null,
    plan: sub?.plan ?? null,
  }
}

/**
 * Récupère le contexte de sécurité complet: user + workspace + role + subscription.
 * À utiliser dans les routes API pour valider les permissions.
 */
export async function getSecurityContext() {
  const user = await getCurrentUser()
  if (!user) return null
  const ctx = await getActiveWorkspace(user.id)
  if (!ctx) return { user, workspace: null, membership: null, subscription: null, plan: null, role: 'OWNER' as const }
  return {
    user,
    workspace: ctx.workspace,
    membership: ctx.membership,
    subscription: ctx.subscription,
    plan: ctx.plan,
    role: ctx.membership.role as 'DEVELOPER' | 'OWNER',
  }
}

export type SecurityContext = NonNullable<Awaited<ReturnType<typeof getSecurityContext>>>

export function can(permission: 'developer' | 'owner' | 'admin', role: string | undefined): boolean {
  if (!role) return false
  if (permission === 'developer') return role === 'DEVELOPER' || role === 'PLATFORM_ADMIN'
  if (permission === 'owner') return true // tous les rôles authentifiés
  if (permission === 'admin') return role === 'PLATFORM_ADMIN'
  return false
}

/**
 * Quota quotidien (atomic-friendly via upsert).
 */
export async function bumpQuota(workspaceId: string, emails: number, automations = 0) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  await db.quotaUsage.upsert({
    where: { workspaceId_date: { workspaceId, date: today } },
    create: { workspaceId, date: today, emailsSent: emails, automations },
    update: { emailsSent: { increment: emails }, automations: { increment: automations } },
  })
}

export async function getQuotaUsageToday(workspaceId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const row = await db.quotaUsage.findUnique({
    where: { workspaceId_date: { workspaceId, date: today } },
  })
  return { emailsSent: row?.emailsSent ?? 0, automations: row?.automations ?? 0 }
}

export function planLimit(code: string) {
  switch (code) {
    case 'STARTER': return { daily: 1000, automation: 10000, retention: 30 }
    case 'BUSINESS': return { daily: 5000, automation: 50000, retention: 90 }
    case 'PREMIUM': return { daily: 10000, automation: 100000, retention: 180 }
    default: return { daily: 0, automation: 0, retention: 30 }
  }
}

export function addMonthsCal(date: Date, months: number): Date {
  // respecte les mois calendaires (pas 90 jours)
  const d = new Date(date)
  const day = d.getDate()
  d.setMonth(d.getMonth() + months)
  // gestion fin de mois (ex: 31 jan + 3 mois = 30 avril)
  if (d.getDate() < day) d.setDate(0)
  return d
}
