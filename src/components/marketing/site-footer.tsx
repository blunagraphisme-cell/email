'use client'

import * as React from 'react'
import { Mail, Github, Linkedin, Twitter } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'

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

const SOCIALS = [
  { label: 'X', icon: Twitter, href: '#' },
  { label: 'LinkedIn', icon: Linkedin, href: '#' },
  { label: 'GitHub', icon: Github, href: '#' },
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
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Mail className="size-4" />
              </span>
              <span className="text-lg font-bold tracking-tight">
                Mail<span className="text-primary">Oqui</span>
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Automatisez votre marketing par e-mail. Conçu pour les équipes ambitieuses, partout en
              Afrique de l'Ouest.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              <a
                href="https://mail.oquitogo.com"
                className="font-medium text-foreground hover:text-primary"
              >
                mail.oquitogo.com
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

          {/* Socials */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">Suivez-nous</h3>
            <div className="flex items-center gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex size-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <s.icon className="size-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground sm:text-left">
          © 2026 MailOqui — mail.oquitogo.com. Tous droits réservés.
        </div>
      </div>
    </footer>
  )
}
