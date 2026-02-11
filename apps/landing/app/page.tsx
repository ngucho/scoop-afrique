import { HeroB2b } from '@/components/hero-b2b'
import { OffersSection } from '@/components/offers-section'
import { StatsSection } from '@/components/stats-section'
import { CarouselSection } from '@/components/carousel-section'
import { LeadCtaSection } from '@/components/lead-cta-section'
import { Footer } from '@/components/footer'
import { CursorTracker } from 'scoop'

export default function HomePage() {
  return (
    <>
      <div className="hidden lg:block">
        <CursorTracker />
      </div>
      <main className="min-h-screen bg-background">
        <HeroB2b />
        <OffersSection />
        <StatsSection />
        <CarouselSection />
        <LeadCtaSection />
        <Footer />
      </main>
    </>
  )
}
