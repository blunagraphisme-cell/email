/**
 * EmailOqui — public URL helper.
 *
 * Derives the public base URL (the one browsers see) from incoming request
 * headers, supporting both production and sandbox preview environments.
 *
 * The Caddy gateway forwards requests with:
 *   - Host: {original browser host}                  (the public host)
 *   - X-Forwarded-Proto: {scheme}                   (e.g. "https")
 *   - X-Forwarded-Host: {original host} (optional)
 *
 * So in the sandbox preview the URL resolves to
 * https://preview-chat-<session>.space-z.ai, and in production to
 * https://email.oquitogo.online — both of which are configured in the
 * Google OAuth client as authorized redirect URIs.
 *
 * APP_URL is a final fallback when no headers are present (e.g. CLI scripts).
 */

export function getBaseUrl(headers: Headers): string {
  const proto =
    headers.get('x-forwarded-proto') ||
    (process.env.NODE_ENV === 'production' ? 'https' : 'http')
  const host =
    headers.get('x-forwarded-host') ||
    headers.get('host') ||
    process.env.APP_URL?.replace(/^https?:\/\//, '').replace(/\/$/, '') ||
    'localhost:3000'
  return `${proto}://${host.replace(/\/$/, '')}`
}

/**
 * Builds the Google OAuth redirect URI for the current request's host.
 * The returned URI must be registered in the Google OAuth client's
 * "Authorized redirect URIs" list.
 */
export function getGoogleRedirectUri(headers: Headers): string {
  return `${getBaseUrl(headers)}/api/auth/google/callback`
}
