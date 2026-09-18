/**
 * GET /api/auth/google/callback — handles Google OAuth callback.
 *
 * 1. Validates state (CSRF protection) against the cookie set by /api/auth/google.
 * 2. Exchanges the code for tokens via Google's token endpoint.
 * 3. Calls Google's userinfo endpoint to get email, given_name, family_name.
 * 4. Upserts the user in our DB:
 *    - If the user exists: log them in.
 *    - If new: create user (emailVerified=true since Google verified), create
 *      a default workspace "Mon Entreprise", add the user as DEVELOPER,
 *      create a STARTER subscription (EN_ATTENTE — payment required to send).
 * 5. Creates a session cookie (eo_session) and redirects to /dashboard
 *    (or /login?error=... on failure).
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  createSession,
  addMonthsCal,
  SESSION_COOKIE,
} from '@/lib/auth'
import { getBaseUrl, getGoogleRedirectUri } from '@/lib/url'

const STATE_COOKIE = 'eo_google_state'
const SESSION_TTL_DAYS = 7

interface GoogleTokens {
  access_token: string
  id_token?: string
  expires_in: number
  scope: string
  token_type: string
}

interface GoogleUserInfo {
  sub: string
  email: string
  email_verified: boolean
  given_name?: string
  family_name?: string
  name?: string
  picture?: string
  locale?: string
}

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const baseUrl = getBaseUrl(req.headers)
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const errorParam = url.searchParams.get('error')

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/?google_error=oauth_not_configured`)
  }
  if (errorParam) {
    return NextResponse.redirect(`${baseUrl}/?google_error=access_denied`)
  }
  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/?google_error=invalid_callback`)
  }

  // CSRF: validate state cookie
  const cookieState = req.cookies.get(STATE_COOKIE)?.value
  if (!cookieState || cookieState !== state) {
    return NextResponse.redirect(`${baseUrl}/?google_error=state_mismatch`)
  }

  // Derive the redirect URI from the request host (matches what /api/auth/google sent)
  const redirectUri = getGoogleRedirectUri(req.headers)

  // Exchange code for tokens
  let tokens: GoogleTokens
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    })
    if (!tokenRes.ok) {
      return NextResponse.redirect(`${baseUrl}/?google_error=token_exchange_failed`)
    }
    tokens = await tokenRes.json()
  } catch {
    return NextResponse.redirect(`${baseUrl}/?google_error=token_exchange_failed`)
  }

  // Get user info
  let userInfo: GoogleUserInfo
  try {
    const uiRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    if (!uiRes.ok) {
      return NextResponse.redirect(`${baseUrl}/?google_error=userinfo_failed`)
    }
    userInfo = await uiRes.json()
  } catch {
    return NextResponse.redirect(`${baseUrl}/?google_error=userinfo_failed`)
  }

  if (!userInfo.email) {
    return NextResponse.redirect(`${baseUrl}/?google_error=no_email`)
  }

  // Upsert user
  const existing = await db.user.findUnique({ where: { email: userInfo.email.toLowerCase() } })
  let user
  if (existing) {
    if (existing.status !== 'ACTIF') {
      return NextResponse.redirect(`${baseUrl}/?google_error=account_suspended`)
    }
    user = existing
  } else {
    // New Google user → create user + default workspace + STARTER subscription
    user = await db.user.create({
      data: {
        email: userInfo.email.toLowerCase(),
        firstName: userInfo.given_name ?? userInfo.name ?? null,
        lastName: userInfo.family_name ?? null,
        // No password — Google login only
        passwordHash: null,
        emailVerified: userInfo.email_verified === true,
        role: 'USER',
        status: 'ACTIF',
      },
    })

    const workspace = await db.workspace.create({
      data: {
        name: 'Mon Entreprise',
        status: 'ACTIF',
        timezone: 'Africa/Lagos',
      },
    })

    await db.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        role: 'DEVELOPER',
        status: 'ACTIF',
        invitedBy: user.id,
      },
    })

    const plan = await db.plan.findUnique({ where: { code: 'STARTER' } })
    if (plan) {
      const startDate = new Date()
      const endDate = addMonthsCal(startDate, plan.durationMonths)
      await db.subscription.create({
        data: {
          workspaceId: workspace.id,
          planId: plan.id,
          status: 'EN_ATTENTE',
          startDate,
          endDate,
        },
      })
    }

    await db.auditLog.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        action: 'WORKSPACE_CREATED',
        entityType: 'Workspace',
        entityId: workspace.id,
        metadata: JSON.stringify({ name: workspace.name, via: 'google' }),
      },
    })
  }

  // Create session + set cookie directly on the redirect response
  const token = await createSession(user.id)
  const res = NextResponse.redirect(`${baseUrl}/`)
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' || req.headers.get('x-forwarded-proto') === 'https',
    path: '/',
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  })
  // Clear the state cookie
  res.cookies.delete(STATE_COOKIE)
  return res
}
