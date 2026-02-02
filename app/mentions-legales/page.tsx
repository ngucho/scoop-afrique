import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Footer } from '@/components/footer'

const BASE_URL = 'https://scoop-afrique.com'

export const metadata: Metadata = {
  title: 'Mentions Légales',
  description: 'Mentions légales de Scoop Afrique. Informations sur l\'éditeur, l\'hébergeur et les conditions d\'utilisation.',
  alternates: {
    canonical: `${BASE_URL}/mentions-legales`,
  },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/mentions-legales`,
    title: 'Mentions Légales | Scoop Afrique',
    description: 'Mentions légales de Scoop Afrique. Éditeur, hébergeur et conditions d\'utilisation.',
    siteName: 'Scoop Afrique',
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Scoop Afrique' }],
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
}

export default function LegalNoticePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l&apos;accueil
          </Link>
        </div>
      </header>

      {/* Content */}
      <article className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
          Mentions Légales
        </h1>
        <p className="mb-12 text-muted-foreground">
          Dernière mise à jour : Février 2026
        </p>

        <div className="prose prose-lg prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold">1. Éditeur du Site</h2>
            <ul className="list-none space-y-1 text-muted-foreground">
              <li><strong>Nom</strong> : Scoop Afrique</li>
              <li><strong>Forme juridique</strong> : SARL</li>
              <li><strong>Siège social</strong> : Abidjan, Côte d&apos;Ivoire</li>
              <li><strong>Email</strong> : Contact@scoop-afrique.com</li>
              <li><strong>Directeur de la publication</strong> : Armand TAGBA</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold">2. Hébergement</h2>
            <ul className="list-none space-y-1 text-muted-foreground">
              <li><strong>Hébergeur</strong> : Vercel Inc.</li>
              <li><strong>Adresse</strong> : 340 S Lemon Ave #4133, Walnut, CA 91789, USA</li>
              <li><strong>Site web</strong> : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">vercel.com</a></li>
            </ul>
          </section> 

          <section>
            <h2 className="text-2xl font-bold">3. Propriété intellectuelle</h2>
            <p className="text-muted-foreground">
              L&apos;ensemble du contenu de ce site (textes, images, videos, logos, graphismes, 
              icones, etc.) est la propriété exclusive de Scoop Afrique ou de ses partenaires, 
              sauf mention contraire.
            </p>
            <p className="text-muted-foreground">
              Toute reproduction, representation, modification, publication, transmission, 
              ou exploitation de tout ou partie du contenu de ce site, par quelque procédé 
              que ce soit, sans l&apos;autorisation préalable écrite de Scoop Afrique, est 
              strictement interdite.
            </p>
            <p className="text-muted-foreground">
              Le nom &quot;Scoop Afrique&quot; (avec le point) est une marque déposée. Toute 
              utilisation non autorisée de cette marque est prohibée.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">4. Limitation de responsabilité</h2>
            <p className="text-muted-foreground">
              Scoop Afrique s&apos;efforce de fournir des informations exactes et à jour, 
              mais ne peut garantir l&apos;exactitude, la complétude ou l&apos;actualité des 
              informations diffusées sur ce site.
            </p>
            <p className="text-muted-foreground">
              Scoop Afrique ne pourra être tenu responsable des dommages directs ou indirects 
              résultant de l&apos;utilisation de ce site ou de l&apos;impossibilité d&apos;y accéder.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">5. Liens externes</h2>
            <p className="text-muted-foreground">
              Ce site peut contenir des liens vers des sites externes. Scoop Afrique n&apos;exerce 
              aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu 
              ou leurs pratiques en matière de protection des données personnelles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">6. Cookies (optionnel)</h2>
            <p className="text-muted-foreground">
              Ce site utilise des cookies. Pour plus d&apos;informations sur notre utilisation 
              des cookies, veuillez consulter notre{' '}
              <Link href="/politique-de-confidentialite" className="text-primary hover:underline">
                Politique de Confidentialité
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">7. Droit applicable</h2>
            <p className="text-muted-foreground">
              Les présentes mentions légales sont régies par le droit ivoirien. En cas de 
              litige, les tribunaux d&apos;Abidjan seront seuls compétents.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">8. Contact</h2>
            <p className="text-muted-foreground">
              Pour toute question concernant ces mentions légales, vous pouvez nous 
              contacter à l&apos;adresse :
            </p>
            <ul className="list-none space-y-1 text-muted-foreground">
              <li><strong>Email</strong> : Contact@scoop-afrique.com</li>
            </ul>
          </section>
        </div>
      </article>

      <Footer />
    </main>
  )
}
