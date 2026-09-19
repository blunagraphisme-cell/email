'use client'

import * as React from 'react'
import {
  ArrowRight,
  CheckCircle2,
  Mail,
  Send,
  Users,
  MousePointerClick,
  TrendingUp,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'

const STATS = [
  { value: '10 000+', label: 'e-mails / jour' },
  { value: '99.2%', label: 'délivrabilité' },
  { value: '4.8/5', label: 'satisfaction' },
  { value: '4 pays', label: 'Nigeria · Bénin · Togo · Ghana' },
]

export function LandingHero() {
  const setView = useAppStore((s) => s.setView)
  const openAuth = useAppStore((s) => s.openAuth)

  return (
    <section className="relative isolate overflow-hidden bg-mesh">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:px-8 lg:pb-24 lg:pt-20">
        {/* Left copy */}
        <div className="flex flex-col items-start justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <span className="size-1.5 rounded-full bg-primary" aria-hidden />
            Couche de reporting & gestion d'abonnement
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Vos statistiques e-mail,{' '}
            <span className="text-primary">centralisées et claires</span>.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Votre application envoie les e-mails. EmailOqui agrège les événements,
            calcule les taux et les présente au propriétaire — sans jamais exposer
            la configuration technique.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" onClick={() => setView('pricing')} className="h-11 px-6">
              Voir nos offres
              <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => openAuth('signup')}
              className="h-11 px-6"
            >
              Commencer maintenant
            </Button>
          </div>
          <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-primary" />
            Aucune carte requise pour l'essai. Configurez en moins de 5 minutes.
          </div>
        </div>

        {/* Right mock dashboard */}
        <div className="relative flex items-center justify-center">
          <MockDashboard />
        </div>
      </div>

      {/* Stats band */}
      <div className="border-t border-border/60 bg-background/40 backdrop-blur-sm">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 sm:grid-cols-4 sm:px-6 lg:px-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center sm:text-left">
              <div className="text-2xl font-bold text-foreground sm:text-3xl">{s.value}</div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function MockDashboard() {
  // Lightweight mock dashboard card (CSS only — no images)
  const bars = [42, 58, 65, 48, 72, 88, 79, 95, 70, 83, 91, 86]
  return (
    <div className="relative w-full max-w-md">
      {/* Glow */}
      <div className="absolute -inset-4 rounded-3xl bg-primary/10 blur-2xl" aria-hidden />
      <div className="relative rounded-2xl border border-border bg-card p-4 shadow-xl">
        {/* header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Mail className="size-4" />
            </span>
            <div>
              <div className="text-xs font-semibold text-foreground">Newsletter — Octobre</div>
              <div className="text-[10px] text-muted-foreground">Envoi en cours</div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" /> LIVE
          </span>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-2 py-3">
          <Kpi icon={Send} value="1 248" label="Envoyés" />
          <Kpi icon={Users} value="1 132" label="Délivrés" />
          <Kpi icon={MousePointerClick} value="284" label="Clics" />
        </div>

        {/* Mini chart */}
        <div className="rounded-lg border border-border bg-background/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">Performance (30 j)</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-foreground">
              <TrendingUp className="size-3" /> +12.4%
            </span>
          </div>
          <div className="flex h-20 items-end gap-1.5" aria-hidden>
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-gradient-to-t from-primary/40 to-primary"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="mt-3 flex flex-col gap-1.5">
          {[
            { name: 'Awa D.', action: 'a ouvert', time: 'il y a 2 min' },
            { name: 'Komlan K.', action: 'a cliqué', time: 'il y a 5 min' },
            { name: 'Afi M.', action: 'a ouvert', time: 'il y a 8 min' },
          ].map((a) => (
            <div key={a.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-secondary text-[9px] font-semibold text-secondary-foreground">
                  {a.name.charAt(0)}
                </span>
                <span className="text-foreground">
                  <span className="font-medium">{a.name}</span>{' '}
                  <span className="text-muted-foreground">{a.action}</span>
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Kpi({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>
  value: string
  label: string
}) {
  return (
    <div className="rounded-lg border border-border bg-background/60 p-2.5">
      <div className="flex items-center gap-1.5 text-primary">
        <Icon className="size-3.5" />
      </div>
      <div className="mt-1 text-sm font-bold text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  )
}
