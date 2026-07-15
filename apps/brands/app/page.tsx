import type { Metadata } from 'next'
import { HeroBrands } from '@/components/hero-brands'
import { WhoWeAreSection } from '@/components/who-we-are-section'
import { StatsSection } from '@/components/stats-section'
import { ValuesSection } from '@/components/values-section'
import { CarouselSection } from '@/components/carousel-section'
import { ProgramsTeaserSection } from '@/components/programs-teaser-section'
import { ContactCtaSection } from '@/components/contact-cta-section'
import { Footer } from '@/components/footer'
import { CursorTracker } from 'scoop'
import { getBrandAudienceSummary } from '@/lib/brand-audience'

export const metadata: Metadata = {
  openGraph: {
    images: [{ url: '/images/hero-brands.png', width: 1200, height: 630, alt: 'Scoop Afrique — Le média de référence de la jeunesse africaine' }],
  },
  twitter: {
    images: ['/images/hero-brands.png'],
  },
}

export default async function HomePage() {
  const audience = await getBrandAudienceSummary()
  return (
    <>
      <div className="hidden lg:block">
        <CursorTracker />
      </div>
      <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-background">
        <HeroBrands audience={audience} />
        <WhoWeAreSection />
        <StatsSection audience={audience} />
        <ValuesSection />
        <CarouselSection />
        <ProgramsTeaserSection />
        <ContactCtaSection />
        <Footer />
      </main>
    </>
  )
}
