import { HeroVideo } from "@/components/hero-video";
import { ManifesteSection } from "@/components/manifeste-section";
import { WhySection } from "@/components/why-section";
import { PublicationsSection } from "@/components/publications-section";
import { SocialCtaSection } from "@/components/social-cta-section";
import { Footer } from "@/components/footer";
import { CursorTracker } from "@/components/cursor-tracker";

/**
 * ================================================
 * SCOOP.AFRIQUE - Landing Page Temporaire
 * ================================================
 *
 * Design : Urban Street Art x African Heritage
 * Couleur primaire : #FF3131 (Scoop Red)
 * Typographie logo : Brasika
 *
 * IMPORTANT :
 * - Le vrai Scoop.Afrique = avec le POINT
 * - Contact : Contact@scoop-afrique.com
 *
 * STRUCTURE :
 * 1. Hero - Video fullscreen avec logo et reseaux sociaux
 * 2. Manifeste - Vision et valeurs
 * 3. Why Section - Pourquoi nous choisir
 * 4. Publications - Apercu du contenu viral
 * 5. Social CTA - Call-to-action reseaux sociaux
 * 6. Footer - Contact et liens
 *
 * POUR PERSONNALISER :
 * - Logo : Remplacez le placeholder dans hero-video.tsx et footer.tsx
 * - Video : Ajoutez videoSrc prop a HeroVideo
 * - Publications : Ajoutez vos images dans /publications/
 * - YouTube : Remplacez YOUR_VIDEO_ID dans publications-section.tsx
 *
 * ================================================
 */
export default function HomePage() {
  return (
    <>
      {/* Custom cursor - Desktop only */}
      <div className="hidden lg:block">
        <CursorTracker />
      </div>

      <main className="min-h-screen cursor-none bg-background lg:cursor-none">
        {/* Hero Section - Video plein ecran avec effets */}
        <HeroVideo
          // CONFIGURATION VIDEO :
          // Decommentez et ajoutez votre video ici
          // videoSrc="/videos/hero-background.mp4"
          // posterImage="/images/hero-poster.jpg"
          // fallbackImage="/images/hero-fallback.jpg"
        />

        {/* Section Manifeste - Vision et ambition */}
        <ManifesteSection />

        {/* Section Pourquoi Scoop.Afrique - Features */}
        <WhySection />

        {/* Section Publications - Apercu du contenu */}
        <PublicationsSection />

        {/* Section CTA Reseaux sociaux */}
        <SocialCtaSection />

        {/* Footer */}
        <Footer />
      </main>
    </>
  );
}
