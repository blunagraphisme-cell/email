'use client'

import * as React from 'react'
import { useAppStore, ViewKey } from '@/lib/store'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { LandingHero } from '@/components/marketing/landing-hero'
import { LandingFeatures } from '@/components/marketing/landing-features'
import { LandingHow } from '@/components/marketing/landing-how'
import { LandingPricingTeaser } from '@/components/marketing/landing-pricing-teaser'
import { LandingTestimonials } from '@/components/marketing/landing-testimonials'
import { LandingFaq } from '@/components/marketing/landing-faq'
import { LandingCta } from '@/components/marketing/landing-cta'
import { FeaturesView } from '@/components/marketing/features-view'
import { PricingView } from '@/components/marketing/pricing-view'
import { ContactView } from '@/components/marketing/contact-view'
import { LegalView } from '@/components/marketing/legal-view'

interface MarketingSiteProps {
  activeView: ViewKey
}

function LandingView() {
  return (
    <main className="flex-1">
      <LandingHero />
      <LandingFeatures />
      <LandingHow />
      <LandingPricingTeaser />
      <LandingTestimonials />
      <LandingFaq />
      <LandingCta />
    </main>
  )
}

function ViewRouter({ activeView }: { activeView: ViewKey }) {
  switch (activeView) {
    case 'features':
      return <FeaturesView />
    case 'pricing':
      return <PricingView />
    case 'contact':
      return <ContactView />
    case 'legal':
      return <LegalView />
    case 'landing':
    default:
      return <LandingView />
  }
}

export function MarketingSite({ activeView }: MarketingSiteProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <ViewRouter activeView={activeView} />
      <SiteFooter />
    </div>
  )
}
