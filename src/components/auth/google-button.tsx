'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * EmailOqui — "Continuer avec Google" button.
 *
 * Triggers the server-side Google OAuth flow by navigating to /api/auth/google
 * which redirects to Google's consent screen. No client-side tokens, no
 * secrets — the entire OAuth exchange happens server-side (per the project's
 * "frontend is never a trust zone" rule).
 */
export function GoogleButton({
  label = 'Continuer avec Google',
  className,
  disabled,
}: {
  label?: string
  className?: string
  disabled?: boolean
}) {
  const onClick = () => {
    if (disabled) return
    // Preserve the intended post-login destination via the `next` query param
    // (the callback will redirect to APP_URL/?next=... or just /).
    window.location.href = '/api/auth/google'
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-10 w-full items-center justify-center gap-3 rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      aria-label={label}
    >
      <GoogleG className="size-4" />
      <span>{label}</span>
    </button>
  )
}

/**
 * Official 4-color Google "G" mark.
 * Source: https://developers.google.com/identity/branding-guidelines
 */
function GoogleG({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.347 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  )
}
