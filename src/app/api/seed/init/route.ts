/**
 * POST /api/seed/init — initialise les plans et le Platform Admin (idempotent).
 * Endpoint non destructeur: à appeler une fois au démarrage.
 */
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

const PLANS = [
  // STARTER — 3 mois, 6 mois, 1 an, 2 ans
  { code: 'STARTER_3M', name: 'Starter', price: 20, currency: 'USD', durationMonths: 3, dailyEmailLimit: 1000, automationLimit: 10000, retentionDays: 30, supportLevel: 'STANDARD', features: JSON.stringify({ scheduling: true, stats: 'essential', support: 'ticket' }) },
  { code: 'STARTER_6M', name: 'Starter', price: 38, currency: 'USD', durationMonths: 6, dailyEmailLimit: 1000, automationLimit: 10000, retentionDays: 30, supportLevel: 'STANDARD', features: JSON.stringify({ scheduling: true, stats: 'essential', support: 'ticket' }) },
  { code: 'STARTER_1Y', name: 'Starter', price: 74, currency: 'USD', durationMonths: 12, dailyEmailLimit: 1000, automationLimit: 10000, retentionDays: 30, supportLevel: 'STANDARD', features: JSON.stringify({ scheduling: true, stats: 'essential', support: 'ticket' }) },
  { code: 'STARTER_2Y', name: 'Starter', price: 120, currency: 'USD', durationMonths: 24, dailyEmailLimit: 1000, automationLimit: 10000, retentionDays: 30, supportLevel: 'STANDARD', features: JSON.stringify({ scheduling: true, stats: 'essential', support: 'ticket' }) },
  // BUSINESS — 3 mois, 6 mois, 1 an, 2 ans
  { code: 'BUSINESS_3M', name: 'Business', price: 20, currency: 'USD', durationMonths: 3, dailyEmailLimit: 5000, automationLimit: 50000, retentionDays: 90, supportLevel: 'PRIORITY', features: JSON.stringify({ scheduling: true, stats: 'advanced', support: 'priority' }) },
  { code: 'BUSINESS_6M', name: 'Business', price: 38, currency: 'USD', durationMonths: 6, dailyEmailLimit: 5000, automationLimit: 50000, retentionDays: 90, supportLevel: 'PRIORITY', features: JSON.stringify({ scheduling: true, stats: 'advanced', support: 'priority' }) },
  { code: 'BUSINESS_1Y', name: 'Business', price: 74, currency: 'USD', durationMonths: 12, dailyEmailLimit: 5000, automationLimit: 50000, retentionDays: 90, supportLevel: 'PRIORITY', features: JSON.stringify({ scheduling: true, stats: 'advanced', support: 'priority' }) },
  { code: 'BUSINESS_2Y', name: 'Business', price: 120, currency: 'USD', durationMonths: 24, dailyEmailLimit: 5000, automationLimit: 50000, retentionDays: 90, supportLevel: 'PRIORITY', features: JSON.stringify({ scheduling: true, stats: 'advanced', support: 'priority' }) },
  // PREMIUM — 3 mois, 6 mois, 1 an, 2 ans
  { code: 'PREMIUM_3M', name: 'Premium', price: 20, currency: 'USD', durationMonths: 3, dailyEmailLimit: 10000, automationLimit: 100000, retentionDays: 180, supportLevel: 'PRIORITY', features: JSON.stringify({ scheduling: 'advanced', stats: 'advanced', reports: 'advanced', support: 'priority' }) },
  { code: 'PREMIUM_6M', name: 'Premium', price: 38, currency: 'USD', durationMonths: 6, dailyEmailLimit: 10000, automationLimit: 100000, retentionDays: 180, supportLevel: 'PRIORITY', features: JSON.stringify({ scheduling: 'advanced', stats: 'advanced', reports: 'advanced', support: 'priority' }) },
  { code: 'PREMIUM_1Y', name: 'Premium', price: 74, currency: 'USD', durationMonths: 12, dailyEmailLimit: 10000, automationLimit: 100000, retentionDays: 180, supportLevel: 'PRIORITY', features: JSON.stringify({ scheduling: 'advanced', stats: 'advanced', reports: 'advanced', support: 'priority' }) },
  { code: 'PREMIUM_2Y', name: 'Premium', price: 120, currency: 'USD', durationMonths: 24, dailyEmailLimit: 10000, automationLimit: 100000, retentionDays: 180, supportLevel: 'PRIORITY', features: JSON.stringify({ scheduling: 'advanced', stats: 'advanced', reports: 'advanced', support: 'priority' }) },
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
  const adminEmail = 'blunagraphisme@gmail.com'
  const existingAdmin = await db.user.findUnique({ where: { email: adminEmail } })
  if (!existingAdmin) {
    await db.user.create({
      data: {
        email: adminEmail,
        firstName: 'Bluna',
        lastName: 'Graphisme',
        passwordHash: hashPassword('Antoine@228'),
        emailVerified: true,
        role: 'PLATFORM_ADMIN',
        status: 'ACTIF',
      },
    })
    results.push(`platform admin created (${adminEmail})`)
  } else {
    // Update password if admin already exists (in case of credential rotation)
    await db.user.update({
      where: { email: adminEmail },
      data: { passwordHash: hashPassword('Antoine@228') },
    })
    results.push('platform admin updated (password refreshed)')
  }
  return NextResponse.json({ success: true, results })
}

export async function GET() {
  return POST()
}
