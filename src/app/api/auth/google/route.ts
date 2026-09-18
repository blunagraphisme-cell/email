/**
 * GET /api/auth/google — initiates Google OAuth 2.0 sign-in flow.
 *
 * 1. Reads GOOGLE_CLIENT_ID from env. If not configured, returns a friendly
 *    HTML error telling the user how to set it up.
 * 2. Derives the redirect URI dynamically from the incoming request's host
 *    headers (so it works in both sandbox preview and production).
 * 3. Generates a random state, stores it in a short-lived cookie (10 min)
 *    to prevent CSRF.
 * 4. Redirects (302) to Google's consent screen with scopes:
 *    openid email profile
 * 5. Google redirects back to /api/auth/google/callback?code=...&state=...
 */
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { getGoogleRedirectUri, getBaseUrl } from '@/lib/url'

const STATE_COOKIE = 'eo_google_state'
const STATE_TTL_SECONDS = 600 // 10 minutes

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return new NextResponse(renderHelpHtml(req), {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
  const redirectUri = getGoogleRedirectUri(req.headers)
  const state = randomBytes(16).toString('hex')
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
    secure: process.env.NODE_ENV === 'production' || req.headers.get('x-forwarded-proto') === 'https',
    path: '/',
    maxAge: STATE_TTL_SECONDS,
  })
  return res
}

function renderHelpHtml(req: NextRequest): string {
  const baseUrl = getBaseUrl(req.headers)
  const redirectUri = `${baseUrl}/api/auth/google/callback`
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>EmailOqui — Google OAuth non configuré</title>
<style>body{font-family:system-ui,sans-serif;background:#f9fafb;color:#1f2937;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:1rem}
.box{max-width:600px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.05)}
h1{color:#d97706;margin:0 0 12px;font-size:20px}
code{background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:13px;color:#374151}
pre{background:#1f2937;color:#f9fafb;padding:12px;border-radius:6px;overflow:auto;font-size:12px}
a{color:#d97706;font-weight:600;text-decoration:none}
a:hover{text-decoration:underline}
.detected{background:#fef3c7;border:1px solid #fde68a;padding:8px 12px;border-radius:6px;font-size:13px;color:#78350f;margin:8px 0 16px}
</style></head>
<body><div class="box">
<h1>Connexion Google non configurée</h1>
<p>Pour activer la connexion avec Google, ajoutez les variables d'environnement dans <code>.env</code> :</p>
<pre>GOOGLE_CLIENT_ID="votre-client-id.googleusercontent.com"
GOOGLE_CLIENT_SECRET="votre-client-secret"</pre>
<div class="detected">
<strong>Domaine détecté :</strong> ${baseUrl}<br/>
<strong>URI de redirection à autoriser dans Google Cloud Console :</strong><br/>
<code>${redirectUri}</code>
</div>
<p style="margin-top:8px;font-size:14px;color:#6b7280;">Créez vos identifiants OAuth sur la <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener">Google Cloud Console</a>, puis ajoutez l'URI ci-dessus dans « URI de redirection autorisés ». Le système détecte automatiquement le domaine courant — pas besoin de APP_URL.</p>
<p style="margin-top:16px"><a href="${baseUrl}/">&larr; Retour à l'accueil</a></p>
</div></body></html>`
}
