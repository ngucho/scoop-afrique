import { HeroBrands } from '@/components/hero-brands'
import { WhoWeAreSection } from '@/components/who-we-are-section'
import { StatsSection } from '@/components/stats-section'
import { ValuesSection } from '@/components/values-section'
import { CarouselSection } from '@/components/carousel-section'
import { OffersSection } from '@/components/offers-section'
import { ContactCtaSection } from '@/components/contact-cta-section'
import { Footer } from '@/components/footer'
import { CursorTracker } from 'scoop'

export default function HomePage() {
  return (
    <>
      <div className="hidden lg:block">
        <CursorTracker />
      </div>
      <main className="min-h-screen bg-background">
        <HeroBrands />
        <WhoWeAreSection />
        <StatsSection />
        <ValuesSection />
        <CarouselSection />
        <OffersSection />
        <ContactCtaSection />
        <Footer />
      </main>
    </>
  )
}
