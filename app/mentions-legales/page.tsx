import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Footer } from '@/components/footer'

const BASE_URL = 'https://scoop-afrique.com'

export const metadata: Metadata = {
  title: 'Mentions Legales',
  description: 'Mentions legales de Scoop.Afrique. Informations sur l\'editeur, l\'hebergeur et les conditions d\'utilisation.',
  alternates: {
    canonical: `${BASE_URL}/mentions-legales`,
  },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/mentions-legales`,
    title: 'Mentions Legales | Scoop.Afrique',
    description: 'Mentions legales de Scoop.Afrique. Editeur, hebergeur et conditions d\'utilisation.',
    siteName: 'Scoop.Afrique',
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Scoop.Afrique' }],
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
            Retour a l&apos;accueil
          </Link>
        </div>
      </header>

      {/* Content */}
      <article className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
          Mentions Legales
        </h1>
        <p className="mb-12 text-muted-foreground">
          Derniere mise a jour : Fevrier 2026
        </p>

        <div className="prose prose-lg prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold">1. Editeur du Site</h2>
            <ul className="list-none space-y-1 text-muted-foreground">
              <li><strong>Nom</strong> : Scoop.Afrique</li>
              <li><strong>Forme juridique</strong> : [A completer]</li>
              <li><strong>Siege social</strong> : Abidjan, Cote d&apos;Ivoire</li>
              <li><strong>Email</strong> : Contact@scoop-afrique.com</li>
              <li><strong>Directeur de la publication</strong> : [A completer]</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold">2. Hebergement</h2>
            <ul className="list-none space-y-1 text-muted-foreground">
              <li><strong>Hebergeur</strong> : Vercel Inc.</li>
              <li><strong>Adresse</strong> : 340 S Lemon Ave #4133, Walnut, CA 91789, USA</li>
              <li><strong>Site web</strong> : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">vercel.com</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold">3. Propriete Intellectuelle</h2>
            <p className="text-muted-foreground">
              L&apos;ensemble du contenu de ce site (textes, images, videos, logos, graphismes, 
              icones, etc.) est la propriete exclusive de Scoop.Afrique ou de ses partenaires, 
              sauf mention contraire.
            </p>
            <p className="text-muted-foreground">
              Toute reproduction, representation, modification, publication, transmission, 
              ou exploitation de tout ou partie du contenu de ce site, par quelque procede 
              que ce soit, sans l&apos;autorisation prealable ecrite de Scoop.Afrique, est 
              strictement interdite.
            </p>
            <p className="text-muted-foreground">
              Le nom &quot;Scoop.Afrique&quot; (avec le point) est une marque deposee. Toute 
              utilisation non autorisee de cette marque est prohibee.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">4. Limitation de Responsabilite</h2>
            <p className="text-muted-foreground">
              Scoop.Afrique s&apos;efforce de fournir des informations exactes et a jour, 
              mais ne peut garantir l&apos;exactitude, la completude ou l&apos;actualite des 
              informations diffusees sur ce site.
            </p>
            <p className="text-muted-foreground">
              Scoop.Afrique ne pourra etre tenu responsable des dommages directs ou indirects 
              resultant de l&apos;utilisation de ce site ou de l&apos;impossibilite d&apos;y acceder.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">5. Liens Externes</h2>
            <p className="text-muted-foreground">
              Ce site peut contenir des liens vers des sites externes. Scoop.Afrique n&apos;exerce 
              aucun controle sur ces sites et decline toute responsabilite quant a leur contenu 
              ou leurs pratiques en matiere de protection des donnees personnelles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">6. Cookies</h2>
            <p className="text-muted-foreground">
              Ce site utilise des cookies. Pour plus d&apos;informations sur notre utilisation 
              des cookies, veuillez consulter notre{' '}
              <Link href="/politique-de-confidentialite" className="text-primary hover:underline">
                Politique de Confidentialite
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">7. Droit Applicable</h2>
            <p className="text-muted-foreground">
              Les presentes mentions legales sont regies par le droit ivoirien. En cas de 
              litige, les tribunaux d&apos;Abidjan seront seuls competents.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">8. Contact</h2>
            <p className="text-muted-foreground">
              Pour toute question concernant ces mentions legales, vous pouvez nous 
              contacter a :
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
