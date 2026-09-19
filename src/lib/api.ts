/**
 * EmailOqui — helpers serveur partagés
 */
import { NextResponse } from 'next/server'
import { getSecurityContext } from './auth'

export async function requireDeveloper() {
  const ctx = await getSecurityContext()
  if (!ctx?.user) {
    return { ctx: null, error: NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Non connecté.' } }, { status: 401 }) }
  }
  if (!ctx.workspace) {
    return { ctx: null, error: NextResponse.json({ success: false, error: { code: 'NO_WORKSPACE', message: 'Aucun workspace actif.' } }, { status: 403 }) }
  }
  if (ctx.role !== 'DEVELOPER') {
    return { ctx: null, error: NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Réservé au Developer.' } }, { status: 403 }) }
  }
  return { ctx, error: null }
}

export async function requireAuth() {
  const ctx = await getSecurityContext()
  if (!ctx?.user) {
    return { ctx: null, error: NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Non connecté.' } }, { status: 401 }) }
  }
  return { ctx, error: null }
}

/**
 * Require an authenticated Platform Admin (role === 'PLATFORM_ADMIN').
 * Platform Admins oversee all workspaces, users, payments, tickets globally.
 * They do NOT need a workspace membership.
 */
export async function requirePlatformAdmin() {
  const ctx = await getSecurityContext()
  if (!ctx?.user) {
    return { ctx: null, error: NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Non connecté.' } }, { status: 401 }) }
  }
  if (ctx.user.role !== 'PLATFORM_ADMIN') {
    return { ctx: null, error: NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Réservé au Platform Admin.' } }, { status: 403 }) }
  }
  return { ctx, error: null }
}

export function ok(data: any, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status })
}

export function fail(code: string, message: string, status = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}
