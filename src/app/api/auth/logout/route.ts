/**
 * POST /api/auth/logout — détruit la session serveur + efface le cookie
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { SESSION_COOKIE } from '@/lib/auth'

export async function POST() {
  const c = await cookies()
  const token = c.get(SESSION_COOKIE)?.value
  if (token) {
    await db.session.deleteMany({ where: { token } }).catch(() => {})
  }
  c.delete(SESSION_COOKIE)
  return NextResponse.json({ success: true })
}
