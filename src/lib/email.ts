/**
 * EmailOqui — Resend integration (server-side only).
 *
 * Wraps the Resend SDK. If RESEND_API_KEY is configured, real emails are sent
 * via Resend from the verified workspace domain. If not configured, the
 * function returns a simulated success so the platform remains usable in dev.
 *
 * White-label rule: the provider name is never exposed to the client.
 * Errors are mapped to a generic SendResult the rest of the app understands.
 */

import { Resend } from 'resend'
import { renderEmailHtml } from './email-render'
import type { Block, SampleData } from '@/components/email-editor/types'

export interface SendEmailParams {
  to: string
  fromName: string
  fromEmail: string
  subject: string
  blocks: Block[]
  data: SampleData
  workspaceName: string
  unsubscribeUrl?: string
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  provider?: string // for internal logs only — never exposed to the client
  error?: string
}

let _resend: Resend | null = null

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  if (!_resend) _resend = new Resend(key)
  return _resend
}

/**
 * Send a single transactional/marking email via Resend.
 * Returns the provider message id (used later to match webhook events).
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const resend = getResend()
  if (!resend) {
    // Dev fallback: simulate a success. The caller will still record SENT
    // and DELIVERED events so the dashboard shows realistic data.
    return {
      success: true,
      messageId: `sim_${Math.random().toString(36).slice(2, 14)}@email.oquitogo.online`,
      provider: 'simulated',
    }
  }
  try {
    const html = renderEmailHtml(
      params.blocks,
      params.data,
      params.workspaceName,
      params.unsubscribeUrl
    )
    const from = `"${params.fromName}" <${params.fromEmail}>`
    const { data, error } = await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html,
      tags: [{ name: 'source', value: 'emailoqui' }],
    })
    if (error) {
      return { success: false, error: error.message }
    }
    return {
      success: true,
      messageId: data?.id ?? `resend_${Date.now()}`,
      provider: 'resend',
    }
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'unknown error' }
  }
}

/**
 * Convenience: send the same campaign to many recipients in batches.
 * Resend's batch API accepts up to 100 emails per call.
 *
 * Returns an array of per-recipient results in the same order as the input.
 */
export async function sendBatch(
  batch: SendEmailParams[]
): Promise<SendEmailResult[]> {
  if (batch.length === 0) return []
  const resend = getResend()
  if (!resend) {
    // Dev fallback: simulate all as success
    return batch.map(() => ({
      success: true,
      messageId: `sim_${Math.random().toString(36).slice(2, 14)}@email.oquitogo.online`,
      provider: 'simulated',
    }))
  }
  try {
    const payload = batch.map((p) => {
      const html = renderEmailHtml(
        p.blocks,
        p.data,
        p.workspaceName,
        p.unsubscribeUrl
      )
      return {
        from: `"${p.fromName}" <${p.fromEmail}>`,
        to: p.to,
        subject: p.subject,
        html,
        tags: [{ name: 'source', value: 'emailoqui' }],
      }
    })
    const { data, error } = await resend.batch.send(payload)
    if (error) {
      // Mark all as failed
      return batch.map(() => ({ success: false, error: error.message }))
    }
    // data is an array of { id } in the same order
    return batch.map((_, i) => ({
      success: true,
      messageId: (data as any)?.[i]?.id ?? `resend_${Date.now()}_${i}`,
      provider: 'resend',
    }))
  } catch (e: any) {
    return batch.map(() => ({ success: false, error: e?.message ?? 'unknown error' }))
  }
}

export const BATCH_SIZE = 50
