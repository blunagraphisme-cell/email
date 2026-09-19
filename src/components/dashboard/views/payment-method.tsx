'use client'

import * as React from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Lock, CheckCircle2 } from 'lucide-react'

// SVG logos for payment methods
function VisaMastercardLogo() {
  return (
    <div className="flex items-center gap-1">
      <svg width="36" height="24" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="white" />
        <path d="M20.5 22.5H17.2L19.25 10H22.55L20.5 22.5Z" fill="#1A1F71" />
        <path d="M31.45 10.35C30.8 10.1 29.75 9.8 28.45 9.8C25.2 9.8 22.9 11.5 22.9 14C22.9 15.85 24.6 16.85 25.9 17.45C27.2 18.05 27.65 18.45 27.65 19C27.65 19.8 26.65 20.15 25.75 20.15C24.35 20.15 23.6 19.95 22.5 19.5L22.05 19.3L21.6 22.05C22.35 22.4 23.75 22.7 25.2 22.7C28.65 22.7 30.9 21.05 30.9 18.4C30.9 16.85 29.9 15.65 27.7 14.7C26.55 14.1 25.85 13.75 25.85 13.15C25.85 12.65 26.4 12.1 27.7 12.1C28.8 12.1 29.55 12.3 30.15 12.55L30.45 12.7L30.9 10.05L31.45 10.35Z" fill="#1A1F71" />
        <path d="M36.35 22.5H39.2L41.6 10H38.75L36.35 22.5Z" fill="#1A1F71" />
        <path d="M35.85 10.3C35.3 10.1 34.4 9.8 33.3 9.8C30.05 9.8 27.75 11.5 27.75 14C27.75 15.85 29.45 16.85 30.75 17.45C32.05 18.05 32.5 18.45 32.5 19C32.5 19.8 31.5 20.15 30.6 20.15C29.2 20.15 28.45 19.95 27.35 19.5L26.9 19.3L26.45 22.05C27.2 22.4 28.6 22.7 30.05 22.7C33.5 22.7 35.75 21.05 35.75 18.4C35.75 16.85 34.75 15.65 32.55 14.7C31.4 14.1 30.7 13.75 30.7 13.15C30.7 12.65 31.25 12.1 32.55 12.1C33.65 12.1 34.4 12.3 35 12.55L35.3 12.7L35.75 10.3H35.85Z" fill="#1A1F71" />
        <path d="M14.5 10L11.5 18.5L11.15 16.75C10.5 14.7 8.8 12.5 6.9 11.4L9.65 22.5H12.95L17.8 10H14.5Z" fill="#1A1F71" />
        <path d="M8.65 10H3.65L3.6 10.25C7.5 11.2 10.1 13.5 11.15 16.75L10.05 11.15C9.85 10.35 9.3 10.05 8.65 10Z" fill="#F7B600" />
      </svg>
      <svg width="36" height="24" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="white" />
        <circle cx="19" cy="16" r="9" fill="#EB001B" />
        <circle cx="29" cy="16" r="9" fill="#F79E1B" />
        <path d="M24 8.5C25.85 10.15 27 12.45 27 16C27 19.55 25.85 21.85 24 23.5C22.15 21.85 21 19.55 21 16C21 12.45 22.15 10.15 24 8.5Z" fill="#FF5F00" />
      </svg>
    </div>
  )
}

function PayPalLogo() {
  return (
    <svg width="80" height="20" viewBox="0 0 100 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 4H6L4.5 19H8.5L9 15H11.5C14 15 16 13 16 10C16 6 14 4 12.5 4ZM11 12H9.5L10 8H11.5C12 8 12.5 8.5 12.5 10C12.5 11 12 12 11 12Z" fill="#003087" />
      <path d="M20 4L18.5 19H22L23 13H25C27.5 13 29.5 11 29.5 8C29.5 5.5 27.5 4 25 4H20ZM24.5 10H23L23.5 7H25C25.5 7 26 7.5 26 8.5C26 9.5 25.5 10 24.5 10Z" fill="#009CDE" />
      <text x="35" y="17" font-family="Arial" font-size="11" font-weight="bold" fill="#003087">PayPal</text>
    </svg>
  )
}

function MobileMoneyLogo() {
  return (
    <svg width="60" height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="24" rx="4" fill="#FFD700" />
      <text x="30" y="16" font-family="Arial" font-size="8" font-weight="bold" fill="#1a1a1a" text-anchor="middle">Mobile Money</text>
    </svg>
  )
}

function CryptoLogo() {
  return (
    <svg width="60" height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="24" rx="4" fill="#F7931A" />
      <text x="30" y="16" font-family="Arial" font-size="8" font-weight="bold" fill="white" text-anchor="middle">Crypto</text>
    </svg>
  )
}

interface PaymentMethod {
  id: string
  name: string
  logo: React.ReactNode
  enabled: boolean
  description: string
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'card',
    name: 'Carte bancaire',
    logo: <VisaMastercardLogo />,
    enabled: true,
    description: 'Visa, Mastercard, Amex',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    logo: <PayPalLogo />,
    enabled: false,
    description: 'Bientôt disponible',
  },
  {
    id: 'mobile-money',
    name: 'Mobile Money',
    logo: <MobileMoneyLogo />,
    enabled: false,
    description: 'MTN, Moov, Orange Money — Bientôt disponible',
  },
  {
    id: 'crypto',
    name: 'Cryptomonnaie',
    logo: <CryptoLogo />,
    enabled: false,
    description: 'Bitcoin, USDT — Bientôt disponible',
  },
]

function getPlanInfo(code: string) {
  const tier = code.replace(/_(3M|6M|1Y|2Y)$/, '')
  const dur = code.match(/_(3M|6M|1Y|2Y)$/)?.[1] || '3M'
  const prices: Record<string, number> = {
    STARTER_3M: 20, STARTER_6M: 38, STARTER_1Y: 74, STARTER_2Y: 120,
    BUSINESS_3M: 20, BUSINESS_6M: 38, BUSINESS_1Y: 74, BUSINESS_2Y: 120,
    PREMIUM_3M: 20, PREMIUM_6M: 38, PREMIUM_1Y: 74, PREMIUM_2Y: 120,
  }
  const durations: Record<string, string> = { '3M': '3 mois', '6M': '6 mois', '1Y': '1 an', '2Y': '2 ans' }
  return {
    name: tier.charAt(0) + tier.slice(1).toLowerCase(),
    price: prices[code] ?? 20,
    duration: durations[dur] ?? '3 mois',
  }
}

const fmtMoney = (n: number, c: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency: c }).format(n)

export function PaymentMethodView() {
  const workspace = useAppStore((s) => s.workspace)
  const viewParam = useAppStore((s) => s.viewParam)
  const setView = useAppStore((s) => s.setView)

  const planCode = viewParam ?? 'STARTER_3M'
  const planInfo = getPlanInfo(planCode)

  // Detect if this is a new subscription or a plan change
  const subStatus = workspace?.subscriptionStatus
  const isNewSubscription = subStatus === 'EN_ATTENTE' || subStatus === 'EXPIRE' || !subStatus
  const actionLabel = isNewSubscription ? 'Activer mon abonnement' : 'Changer de plan'

  return (
    <main className="flex-1 bg-mesh">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Back link */}
        <button
          type="button"
          onClick={() => setView('subscription')}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Retour
        </button>

        {/* Payment card */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-foreground px-6 py-4 text-background">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="EmailOqui" width={28} height={28} className="rounded-md bg-background p-0.5" />
              <span className="text-lg font-bold">EmailOqui Pay</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-background/80">
              <Lock className="size-4" />
              <span>Paiement sécurisé</span>
            </div>
          </div>

          {/* Summary */}
          <div className="border-b border-border bg-muted/30 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{actionLabel}</p>
                <p className="text-lg font-bold">{planInfo.name} — {planInfo.duration}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Montant</p>
                <p className="text-2xl font-bold">{fmtMoney(planInfo.price, 'USD')}</p>
              </div>
            </div>
          </div>

          {/* Method selection */}
          <div className="p-6">
            <h2 className="text-lg font-bold tracking-tight">Choisissez votre moyen de paiement</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sélectionnez comment vous souhaitez payer votre {isNewSubscription ? 'abonnement' : 'changement de plan'}.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  disabled={!method.enabled}
                  onClick={() => method.enabled && setView('payment', planCode)}
                  className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                    method.enabled
                      ? 'border-border hover:border-foreground hover:bg-accent cursor-pointer'
                      : 'border-border opacity-50 cursor-not-allowed'
                  }`}
                >
                  {/* Radio indicator */}
                  <div className={`flex size-5 items-center justify-center rounded-full border-2 ${
                    method.enabled ? 'border-foreground' : 'border-muted-foreground'
                  }`}>
                    {method.enabled && (
                      <div className="size-2.5 rounded-full bg-foreground" />
                    )}
                  </div>

                  {/* Logo */}
                  <div className="flex-shrink-0">
                    {method.logo}
                  </div>

                  {/* Name + description */}
                  <div className="flex-1">
                    <p className="font-semibold">{method.name}</p>
                    <p className="text-xs text-muted-foreground">{method.description}</p>
                  </div>

                  {/* Status badge */}
                  {!method.enabled && (
                    <Badge variant="outline" className="border-muted-foreground/30 bg-muted text-muted-foreground text-xs">
                      Indisponible
                    </Badge>
                  )}
                  {method.enabled && (
                    <Badge variant="outline" className="border-foreground/30 bg-foreground/10 text-foreground text-xs">
                      Disponible
                    </Badge>
                  )}
                </button>
              ))}
            </div>

            {/* Security note */}
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Lock className="size-3.5" />
              Transaction sécurisée. Vos données sont protégées.
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default PaymentMethodView
