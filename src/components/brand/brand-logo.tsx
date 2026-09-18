'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * MailOqui brand logo component.
 * Uses the official PNG mark from /public/logo.png (stylized "G/E" with checkmark + dot).
 *
 * The "MailOqui" wordmark text is rendered next to the icon (the cahier des charges
 * is the source of truth for the brand name).
 *
 * Props:
 * - `size`: icon pixel size (default 32)
 * - `showText`: whether to display the wordmark next to the icon (default true)
 * - `textClassName`: classes for the wordmark span
 * - `className`: extra classes for the wrapper
 */
export function BrandLogo({
  size = 32,
  showText = true,
  textClassName,
  className,
}: {
  size?: number
  showText?: boolean
  textClassName?: string
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <img
        src="/logo.png"
        alt="MailOqui"
        width={size}
        height={size}
        className="rounded-md object-contain"
        style={{ width: size, height: size }}
      />
      {showText && (
        <span className={cn('text-lg font-bold tracking-tight', textClassName)}>
          Mail<span className="text-primary">Oqui</span>
        </span>
      )}
    </span>
  )
}

/**
 * Square icon-only variant (no wordmark).
 */
export function BrandMark({
  size = 32,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <img
      src="/logo.png"
      alt="MailOqui"
      width={size}
      height={size}
      className={cn('rounded-md object-contain', className)}
      style={{ width: size, height: size }}
    />
  )
}
