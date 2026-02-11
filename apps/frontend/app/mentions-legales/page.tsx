import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { Heading } from 'scoop'

export const metadata: Metadata = {
  title: 'Mentions légales',
  description:
    "Mentions légales de Scoop Afrique. Informations sur l'éditeur, l'hébergeur et les conditions d'utilisation.",
}

const backLinkClass =
  'inline-flex items-center gap-2 text-sm text-foreground transition-colors hover:text-primary'

export default function MentionsLegalesPage() {
  return (
    <ReaderLayout>
      <main className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border">
          <div className="mx-auto max-w-4xl px-6 py-6">
            <Link href="/" className={backLinkClass}>
              <ArrowLeft className="h-4 w-4" />
              Retour à l&apos;accueil
            </Link>
          </div>
        </header>
        <article className="mx-auto max-w-4xl px-6 py-16">
          <Heading as="h1" level="h1" className="mb-4">
            Mentions légales
          </Heading>
          <p className="mb-12 text-muted-foreground">Dernière mise à jour : Février 2026</p>
          <div className="space-y-8">
            <section>
              <Heading as="h2" level="h2" className="mb-2">
                1. Éditeur du site
              </Heading>
              <ul className="list-none space-y-1 text-muted-foreground">
                <li><strong>Dénomination</strong> : SCOOP AFRIQUE</li>
                <li><strong>Forme juridique</strong> : SARL (Société à Responsabilité Limitée)</li>
                <li><strong>Capital social</strong> : 1 000 000 FCFA</li>
                <li><strong>Siège social</strong> : Abidjan, Cocody Riviera Faya, non loin de la Clinique Chapelet, Lot 7, Ilot 6 — 01 BP 130 Abidjan 01, Côte d&apos;Ivoire</li>
                <li><strong>Email</strong> : Contact@scoop-afrique.com</li>
                <li><strong>Gérants</strong> : M. TAGBA Guy-Landry Jean Armel Kouadio ; Mlle METSEBO Ines Laure</li>
                <li><strong>Directeur de la publication</strong> : TAGBA Guy-Landry</li>
              </ul>
            </section>
            <section>
              <Heading as="h2" level="h2" className="mb-2">2. Hébergement</Heading>
              <ul className="list-none space-y-1 text-muted-foreground">
                <li><strong>Hébergeur</strong> : Vercel Inc.</li>
                <li><strong>Adresse</strong> : 340 S Lemon Ave #4133, Walnut, CA 91789, USA</li>
                <li><strong>Site web</strong> : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">vercel.com</a></li>
              </ul>
            </section>
            <section>
              <Heading as="h2" level="h2" className="mb-2">3. Propriété intellectuelle</Heading>
              <p className="text-muted-foreground">
                L&apos;ensemble du contenu de ce site (textes, images, vidéos, logos, graphismes, icônes, etc.) est la propriété exclusive de Scoop Afrique ou de ses partenaires, sauf mention contraire. Toute reproduction, représentation, modification, publication, transmission ou exploitation sans l&apos;autorisation préalable écrite de Scoop Afrique est strictement interdite. Le nom &quot;Scoop Afrique&quot; est une marque déposée.
              </p>
            </section>
            <section>
              <Heading as="h2" level="h2" className="mb-2">4. Limitation de responsabilité</Heading>
              <p className="text-muted-foreground">
                Scoop Afrique s&apos;efforce de fournir des informations exactes et à jour mais ne peut garantir l&apos;exactitude, la complétude ou l&apos;actualité des informations. Scoop Afrique ne pourra être tenu responsable des dommages directs ou indirects résultant de l&apos;utilisation de ce site.
              </p>
            </section>
            <section>
              <Heading as="h2" level="h2" className="mb-2">5. Liens externes</Heading>
              <p className="text-muted-foreground">
                Ce site peut contenir des liens vers des sites externes. Scoop Afrique n&apos;exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu ou leurs pratiques.
              </p>
            </section>
            <section>
              <Heading as="h2" level="h2" className="mb-2">6. Cookies</Heading>
              <p className="text-muted-foreground">
                Ce site utilise des cookies. Pour plus d&apos;informations, consultez notre{' '}
                <Link href="/politique-de-confidentialite" className="text-primary hover:underline">Politique de confidentialité</Link>.
              </p>
            </section>
            <section>
              <Heading as="h2" level="h2" className="mb-2">7. Droit applicable</Heading>
              <p className="text-muted-foreground">
                Les présentes mentions légales sont régies par le droit ivoirien. En cas de litige, les tribunaux d&apos;Abidjan seront seuls compétents.
              </p>
            </section>
            <section>
              <Heading as="h2" level="h2" className="mb-2">8. Contact</Heading>
              <p className="text-muted-foreground">Pour toute question : <strong>Email</strong> : Contact@scoop-afrique.com</p>
            </section>
          </div>
        </article>
      </main>
    </ReaderLayout>
  )
}
