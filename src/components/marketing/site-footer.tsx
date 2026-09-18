'use client'

import * as React from 'react'
import { Mail, Phone, MapPin } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/brand/brand-logo'

const COLS: {
  title: string
  links: { label: string; view?: 'features' | 'pricing' | 'contact' | 'legal'; href?: string }[]
}[] = [
  {
    title: 'Produit',
    links: [
      { label: 'Fonctionnalités', view: 'features' },
      { label: 'Tarifs', view: 'pricing' },
      { label: 'Contact', view: 'contact' },
    ],
  },
  {
    title: 'Entreprise',
    links: [
      { label: 'À propos', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Carrières', href: '#' },
    ],
  },
  {
    title: 'Légal',
    links: [
      { label: 'Mentions légales', view: 'legal' },
      { label: 'Confidentialité', view: 'legal' },
      { label: 'CGV', view: 'legal' },
    ],
  },
]

const AGENCIES = [
  { city: 'Lagos', country: 'Nigeria', note: 'Siège', phone: '+234 813 8198 3521' },
  { city: 'Cotonou', country: 'Bénin', note: 'Agence' },
  { city: 'Lomé', country: 'Togo', note: 'Agence', phone: '+228 22 22 77 58' },
  { city: 'Accra', country: 'Ghana', note: 'Agence' },
]

export function SiteFooter() {
  const setView = useAppStore((s) => s.setView)

  return (
    <footer
      className="mt-auto border-t border-border bg-secondary/40"
      aria-label="Pied de page"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand col */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <BrandMark size={36} />
              <span className="text-lg font-bold tracking-tight">
                Email<span className="text-primary">Oqui</span>
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Plateforme africaine de gestion et d'automatisation des e-mails.
              Siège au Nigeria, agences au Bénin, au Togo et au Ghana.
            </p>
            <div className="mt-4 flex flex-col gap-1.5 text-sm text-muted-foreground">
              <a
                href="mailto:contact@oquitogo.com"
                className="inline-flex items-center gap-2 font-medium text-foreground hover:text-primary"
              >
                <Mail className="size-4" />
                contact@oquitogo.com
              </a>
              <a
                href="tel:+23481381983521"
                className="inline-flex items-center gap-2 hover:text-primary"
              >
                <Phone className="size-4" />
                Nigeria : +234 813 8198 3521
              </a>
              <a
                href="tel:+22822227758"
                className="inline-flex items-center gap-2 hover:text-primary"
              >
                <Phone className="size-4" />
                Togo : +228 22 22 77 58
              </a>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              <a
                href="https://email.oquitogo.online"
                className="font-medium text-foreground hover:text-primary"
              >
                email.oquitogo.online
              </a>
            </p>
          </div>

          {/* Link cols */}
          {COLS.map((col) => (
            <nav key={col.title} aria-label={col.title} className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.view ? (
                      <Button
                        variant="link"
                        className="h-auto p-0 text-sm font-normal text-muted-foreground hover:text-primary"
                        onClick={() => setView(link.view!)}
                      >
                        {link.label}
                      </Button>
                    ) : (
                      <a
                        href={link.href ?? '#'}
                        className="text-sm text-muted-foreground hover:text-primary"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Agencies col (replaces socials) */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">Nos agences</h3>
            <ul className="flex flex-col gap-2.5">
              {AGENCIES.map((a) => (
                <li key={a.city} className="flex items-start gap-2 text-sm">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      {a.city}
                      <span className="ml-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {a.note}
                      </span>
                    </span>
                    <span className="text-muted-foreground">{a.country}</span>
                    {a.phone && (
                      <span className="text-xs text-muted-foreground">{a.phone}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground sm:text-left">
          © 2026 EmailOqui — email.oquitogo.online. Siège : Lagos, Nigeria. Tous droits réservés.
        </div>
      </div>
    </footer>
  )
}
