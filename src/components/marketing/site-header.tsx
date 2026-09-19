'use client'

import * as React from 'react'
import { Menu, X } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { BrandLogo, BrandMark } from '@/components/brand/brand-logo'

const NAV_ITEMS: { label: string; view: 'features' | 'pricing' | 'contact' }[] = [
  { label: 'Fonctionnalités', view: 'features' },
  { label: 'Tarifs', view: 'pricing' },
  { label: 'Contact', view: 'contact' },
]

export function SiteHeader() {
  const setView = useAppStore((s) => s.setView)
  const openAuth = useAppStore((s) => s.openAuth)
  const view = useAppStore((s) => s.view)
  const [scrolled, setScrolled] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isActive = (v: string) => view === v

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md transition-shadow',
        scrolled && 'shadow-sm',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <button
          type="button"
          onClick={() => setView('landing')}
          className="flex items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Accueil EmailOqui"
        >
          <BrandLogo size={32} />
        </button>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
          {NAV_ITEMS.map((item) => (
            <Button
              key={item.view}
              variant="ghost"
              size="sm"
              onClick={() => setView(item.view)}
              className={cn(
                'h-9 px-3 text-sm font-medium text-muted-foreground hover:text-foreground',
                isActive(item.view) && 'bg-accent text-foreground',
              )}
            >
              {item.label}
            </Button>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm" onClick={() => openAuth('login')} className="h-9">
            Se connecter
          </Button>
          <Button size="sm" onClick={() => openAuth('signup')} className="h-9">
            Commencer
          </Button>
        </div>

        {/* Mobile hamburger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] p-0">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-border p-4">
                <SheetTitle className="flex items-center gap-2 text-base font-bold">
                  <BrandMark size={26} />
                  Email<span className="text-primary">Oqui</span>
                </SheetTitle>
                <SheetClose
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                  aria-label="Fermer le menu"
                >
                  <X className="size-5" />
                </SheetClose>
              </div>
              <nav className="flex flex-col gap-1 p-4" aria-label="Navigation mobile">
                {NAV_ITEMS.map((item) => (
                  <Button
                    key={item.view}
                    variant={isActive(item.view) ? 'secondary' : 'ghost'}
                    className="justify-start"
                    onClick={() => {
                      setView(item.view)
                      setMobileOpen(false)
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    openAuth('login')
                    setMobileOpen(false)
                  }}
                >
                  Se connecter
                </Button>
                <Button
                  onClick={() => {
                    openAuth('signup')
                    setMobileOpen(false)
                  }}
                >
                  Commencer
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
