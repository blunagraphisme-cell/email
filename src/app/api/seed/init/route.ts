/**
 * POST /api/seed/init — initialise les plans et le Platform Admin (idempotent).
 * Endpoint non destructeur: à appeler une fois au démarrage.
 */
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

const PLANS = [
  { code: 'STARTER', name: 'Starter', price: 20, currency: 'USD', durationMonths: 3, dailyEmailLimit: 1000, automationLimit: 10000, retentionDays: 30, supportLevel: 'STANDARD', features: JSON.stringify({ scheduling: true, stats: 'essential', support: 'ticket' }) },
  { code: 'BUSINESS', name: 'Business', price: 45, currency: 'USD', durationMonths: 3, dailyEmailLimit: 5000, automationLimit: 50000, retentionDays: 90, supportLevel: 'PRIORITY', features: JSON.stringify({ scheduling: true, stats: 'advanced', support: 'priority' }) },
  { code: 'PREMIUM', name: 'Premium', price: 80, currency: 'USD', durationMonths: 3, dailyEmailLimit: 10000, automationLimit: 100000, retentionDays: 180, supportLevel: 'PRIORITY', features: JSON.stringify({ scheduling: 'advanced', stats: 'advanced', reports: 'advanced', support: 'priority' }) },
]

export async function POST() {
  const results: string[] = []
  for (const p of PLANS) {
    const existing = await db.plan.findUnique({ where: { code: p.code } })
    if (!existing) {
      await db.plan.create({ data: { ...p, status: 'ACTIF' } })
      results.push(`plan ${p.code} created`)
    } else {
      await db.plan.update({ where: { code: p.code }, data: { ...p } })
      results.push(`plan ${p.code} updated`)
    }
  }
  const adminEmail = 'admin@email.oquitogo.online'
  const existingAdmin = await db.user.findUnique({ where: { email: adminEmail } })
  if (!existingAdmin) {
    await db.user.create({
      data: {
        email: adminEmail,
        firstName: 'Platform',
        lastName: 'Admin',
        passwordHash: hashPassword('EmailOqui2026!'),
        emailVerified: true,
        role: 'PLATFORM_ADMIN',
        status: 'ACTIF',
      },
    })
    results.push('platform admin created (admin@email.oquitogo.online / EmailOqui2026!)')
  } else {
    results.push('platform admin already exists')
  }
  return NextResponse.json({ success: true, results })
}

export async function GET() {
  return POST()
}
