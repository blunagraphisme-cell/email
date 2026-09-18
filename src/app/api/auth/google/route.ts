/**
 * GET /api/auth/google — initiates Google OAuth 2.0 sign-in flow.
 *
 * 1. Reads GOOGLE_CLIENT_ID + APP_URL from env. If not configured, returns
 *    a friendly HTML error telling the user how to set them up.
 * 2. Generates a random state, stores it in a short-lived cookie (10 min)
 *    to prevent CSRF.
 * 3. Redirects (302) to Google's consent screen with scopes:
 *    openid email profile
 * 4. Google redirects back to /api/auth/google/callback?code=...&state=...
 */
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { addMonthsCal } from '@/lib/auth'
import { db } from '@/lib/db'

const STATE_COOKIE = 'eo_google_state'
const STATE_TTL_SECONDS = 600 // 10 minutes

function getEnv() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    appUrl: process.env.APP_URL || (process.env.NODE_ENV === 'production' ? 'https://email.oquitogo.com' : 'http://localhost:3000'),
  }
}

export async function GET() {
  const { clientId, appUrl } = getEnv()
  if (!clientId) {
    return new NextResponse(renderHelpHtml(), {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
  const state = randomBytes(16).toString('hex')
  const redirectUri = `${appUrl.replace(/\/$/, '')}/api/auth/google/callback`
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'openid email profile')
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('prompt', 'select_account')
  const res = NextResponse.redirect(authUrl.toString())
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: STATE_TTL_SECONDS,
  })
  return res
}

function renderHelpHtml(): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>EmailOqui — Google OAuth non configuré</title>
<style>body{font-family:system-ui,sans-serif;background:#f9fafb;color:#1f2937;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:1rem}
.box{max-width:560px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.05)}
h1{color:#d97706;margin:0 0 12px;font-size:20px}
code{background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:13px;color:#374151}
pre{background:#1f2937;color:#f9fafb;padding:12px;border-radius:6px;overflow:auto;font-size:12px}
a{color:#d97706;font-weight:600;text-decoration:none}
a:hover{text-decoration:underline}</style></head>
<body><div class="box">
<h1>Connexion Google non configurée</h1>
<p>Pour activer la connexion avec Google, l'administrateur doit configurer les variables d'environnement dans le fichier <code>.env</code> :</p>
<pre>GOOGLE_CLIENT_ID="votre-client-id.googleusercontent.com"
GOOGLE_CLIENT_SECRET="votre-client-secret"
APP_URL="http://localhost:3000"</pre>
<p style="margin-top:16px;font-size:14px;color:#6b7280;">Créez vos identifiants OAuth sur la <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener">Google Cloud Console</a>, puis ajoutez l'URI de redirection suivante dans les origines autorisées :</p>
<pre>http://localhost:3000/api/auth/google/callback
https://email.oquitogo.com/api/auth/google/callback</pre>
<p style="margin-top:16px"><a href="/">&larr; Retour à l'accueil</a></p>
</div></body></html>`
}
