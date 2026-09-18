/**
 * EmailOqui — server-side email HTML renderer.
 *
 * Converts a campaign's block array into a self-contained HTML email string
 * suitable for sending via Resend. Variables ({{prenom}}, {{nom}},
 * {{email}}, {{entreprise}}) are substituted per-recipient.
 *
 * The visual identity mirrors the client-side EmailPreview component:
 * amber header with the EmailOqui logo, content body, and a footer with
 * unsubscribe link. White-label rule: the technical provider (Resend) is
 * never mentioned in the rendered HTML.
 */

import type { Block, SampleData } from '@/components/email-editor/types'
import { substituteVariables } from '@/components/email-editor/types'

const BRAND_LOGO_URL = 'https://email.oquitogo.online/logo.png'
const BRAND_PRIMARY = '#f59e0b' // amber-500

/** Escape HTML special characters to prevent injection. */
function escapeHtml(s: string): string {
  if (!s) return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function alignToText(align?: string): string {
  if (align === 'center') return 'center'
  if (align === 'right') return 'right'
  return 'left'
}

/** Render a single block to HTML (already variable-substituted). */
function renderBlock(block: Block, data: SampleData): string {
  const align = alignToText(block.align)
  const text = block.text ? substituteVariables(escapeHtml(block.text), data) : ''
  switch (block.type) {
    case 'title':
      return `<h2 style="margin:0 0 16px 0;font-size:22px;font-weight:700;line-height:1.3;color:#1a1a1a;text-align:${align};">${text}</h2>`
    case 'text':
      // Preserve line breaks
      const paragraphs = text.split(/\n\n+/)
      return paragraphs
        .map(
          (p) =>
            `<p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#374151;text-align:${align};">${p.replace(/\n/g, '<br />')}</p>`
        )
        .join('')
    case 'button': {
      const url = block.url ? substituteVariables(block.url, data) : '#'
      return `<div style="text-align:${align};margin:16px 0;">
        <a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 24px;background-color:${BRAND_PRIMARY};color:#ffffff;text-decoration:none;font-weight:600;border-radius:6px;font-size:15px;">${text}</a>
      </div>`
    }
    case 'image': {
      const url = block.url ? substituteVariables(block.url, data) : ''
      const alt = block.alt ? substituteVariables(block.alt, data) : 'Image'
      return `<div style="text-align:${align};margin:16px 0;">
        <img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" style="max-width:100%;height:auto;border-radius:8px;" />
      </div>`
    }
    case 'divider':
      return `<hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0;" />`
    case 'list': {
      const items = block.items || []
      const lis = items
        .map((it) => `<li style="margin:0 0 6px 0;font-size:15px;line-height:1.6;color:#374151;">${substituteVariables(escapeHtml(it), data)}</li>`)
        .join('')
      return `<ul style="margin:0 0 12px 0;padding-left:20px;text-align:${align};">${lis}</ul>`
    }
    default:
      return ''
  }
}

/**
 * Render the full HTML email for a single recipient.
 *
 * @param blocks Campaign content blocks
 * @param data Recipient data for variable substitution
 * @param workspaceName Display name shown in the email header and footer
 * @param unsubscribeUrl Optional unsubscribe link (per-recipient)
 */
export function renderEmailHtml(
  blocks: Block[],
  data: SampleData,
  workspaceName: string,
  unsubscribeUrl?: string
): string {
  const body = (blocks || []).map((b) => renderBlock(b, data)).join('\n')
  const year = new Date().getFullYear()
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(workspaceName)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND_PRIMARY};padding:16px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <img src="${BRAND_LOGO_URL}" alt="EmailOqui" width="28" height="28" style="display:inline-block;vertical-align:middle;border-radius:6px;background-color:rgba(255,255,255,0.9);padding:2px;" />
                    <span style="margin-left:8px;font-size:16px;font-weight:600;color:#ffffff;vertical-align:middle;">${escapeHtml(workspaceName)}</span>
                  </td>
                  <td align="right" style="vertical-align:middle;font-size:11px;color:rgba(255,255,255,0.85);">email.oquitogo.online</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 24px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 24px;border-top:1px solid #e5e7eb;background-color:#f9fafb;text-align:center;font-size:12px;color:#6b7280;">
              <p style="margin:0 0 6px 0;">Cet e-mail vous a été envoyé par <strong style="color:#374151;">${escapeHtml(workspaceName)}</strong>.</p>
              <p style="margin:0 0 6px 0;">Vous recevez cet e-mail car vous faites partie de notre liste de contacts.</p>
              ${unsubscribeUrl ? `<p style="margin:0;"><a href="${escapeHtml(unsubscribeUrl)}" style="color:#d97706;font-weight:500;text-decoration:underline;">Se désabonner</a></p>` : ''}
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0 0;font-size:11px;color:#9ca3af;text-align:center;">© ${year} ${escapeHtml(workspaceName)} — email.oquitogo.online</p>
      </td>
    </tr>
  </table>
</body>
</html>`
}
