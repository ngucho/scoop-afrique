import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { LegalNav } from '@/components/legal/LegalNav'
import { Heading } from 'scoop'

export const metadata: Metadata = {
  title: 'Mentions légales',
  description:
    "Mentions légales de Scoop Afrique : éditeur, hébergement, propriété intellectuelle, loi applicable et liens vers la politique de confidentialité et les CGU.",
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
          <p className="mb-12 text-muted-foreground">Dernière mise à jour : avril 2026</p>
          <div className="space-y-8">
            <section>
              <Heading as="h2" level="h2" className="mb-2">
                1. Éditeur du site
              </Heading>
              <ul className="list-none space-y-1 text-muted-foreground">
                <li>
                  <strong>Dénomination</strong> : SCOOP AFRIQUE
                </li>
                <li>
                  <strong>Forme juridique</strong> : SARL (Société à Responsabilité Limitée)
                </li>
                <li>
                  <strong>Capital social</strong> : 1 000 000 FCFA
                </li>
                <li>
                  <strong>Siège social</strong> : Abidjan, Cocody Riviera Faya, non loin de la Clinique Chapelet, Lot 7,
                  Ilot 6 — 01 BP 130 Abidjan 01, Côte d&apos;Ivoire
                </li>
                <li>
                  <strong>RCCM</strong> : CI-ABJ-03-2025-B12-05806
                </li>
                <li>
                  <strong>Email</strong> :{' '}
                  <a href="mailto:Contact@scoop-afrique.com" className="text-primary hover:underline">
                    Contact@scoop-afrique.com
                  </a>
                </li>
                <li>
                  <strong>Gérants</strong> : M. TAGBA Guy-Landry Jean Armel Kouadio ; Mlle METSEBO Ines Laure
                </li>
                <li>
                  <strong>Directeur de la publication</strong> : TAGBA Guy-Landry
                </li>
              </ul>
            </section>
            <section>
              <Heading as="h2" level="h2" className="mb-2">
                2. Hébergement et infrastructure
              </Heading>
              <ul className="list-none space-y-2 text-muted-foreground">
                <li>
                  <strong>Site et API</strong> : hébergés par{' '}
                  <strong>Vercel Inc.</strong>, 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis —{' '}
                  <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    vercel.com
                  </a>
                </li>
                <li>
                  Les données applicatives (comptes, contenus éditoriaux) peuvent être stockées sur des serveurs
                  sécurisés fournis par nos prestataires techniques (ex. bases de données hébergées dans l&apos;Union
                  européenne ou aux États-Unis), dans le respect des garanties prévues par la réglementation applicable et
                  notre{' '}
                  <Link href="/politique-de-confidentialite" className="text-primary hover:underline">
                    Politique de confidentialité
                  </Link>
                  .
                </li>
              </ul>
            </section>
            <section>
              <Heading as="h2" level="h2" className="mb-2">
                3. Propriété intellectuelle
              </Heading>
              <p className="text-muted-foreground">
                L&apos;ensemble du contenu éditorial du site (textes, images, vidéos, podcasts, logos, charte graphique,
                bases de données produites) est la propriété de Scoop Afrique ou de ses partenaires, sauf mention
                contraire (crédits photos, partenaires). Toute reproduction, représentation, adaptation ou exploitation
                sans autorisation écrite préalable est interdite. Le nom « Scoop Afrique » / « Scoop.Afrique » et les
                signes distinctifs associés constituent des éléments protégés.
              </p>
            </section>
            <section>
              <Heading as="h2" level="h2" className="mb-2">
                4. Conditions d&apos;utilisation
              </Heading>
              <p className="text-muted-foreground">
                L&apos;utilisation du site est soumise aux{' '}
                <Link href="/cgu" className="text-primary hover:underline">
                  Conditions générales d&apos;utilisation (CGU)
                </Link>
                , qui précisent notamment les règles applicables aux comptes lecteurs, aux commentaires ou contenus
                générés par les utilisateurs et aux limitations de responsabilité.
              </p>
            </section>
            <section>
              <Heading as="h2" level="h2" className="mb-2">
                5. Limitation de responsabilité
              </Heading>
              <p className="text-muted-foreground">
                Scoop Afrique s&apos;efforce d&apos;assurer l&apos;exactitude des informations publiées. Néanmoins, des
                erreurs ou omissions peuvent subsister ; l&apos;éditeur ne saurait être tenu responsable des dommages
                directs ou indirects liés à l&apos;usage du site ou à l&apos;interprétation des contenus. Les liens
                hypertextes vers des sites tiers n&apos;impliquent aucune approbation de leur contenu.
              </p>
            </section>
            <section>
              <Heading as="h2" level="h2" className="mb-2">
                6. Données personnelles et cookies
              </Heading>
              <p className="text-muted-foreground">
                Le traitement des données personnelles (newsletter, compte lecteur, mesure d&apos;audience, cookies) est
                décrit dans notre{' '}
                <Link href="/politique-de-confidentialite" className="text-primary hover:underline">
                  Politique de confidentialité
                </Link>
                . Un bandeau vous permet d&apos;exprimer vos choix concernant les cookies non essentiels lors de votre
                première visite.
              </p>
            </section>
            <section>
              <Heading as="h2" level="h2" className="mb-2">
                7. Médiation et réclamations
              </Heading>
              <p className="text-muted-foreground">
                Pour toute réclamation relative au site ou au traitement de vos données, contactez-nous à l&apos;adresse
                indiquée ci-dessus. Conformément aux dispositions applicables, vous pouvez également exercer vos droits
                (accès, rectification, opposition, etc.) comme détaillé dans la politique de confidentialité.
              </p>
            </section>
            <section>
              <Heading as="h2" level="h2" className="mb-2">
                8. Droit applicable
              </Heading>
              <p className="text-muted-foreground">
                Les présentes mentions légales sont régies par le droit ivoirien. En cas de litige, et à défaut de
                solution amiable, les tribunaux d&apos;Abidjan sont seuls compétents.
              </p>
            </section>
            <section>
              <Heading as="h2" level="h2" className="mb-2">
                9. Contact
              </Heading>
              <p className="text-muted-foreground">
                <strong>Email</strong> :{' '}
                <a href="mailto:Contact@scoop-afrique.com" className="text-primary hover:underline">
                  Contact@scoop-afrique.com
                </a>
              </p>
            </section>
          </div>
          <LegalNav current="mentions" />
        </article>
      </main>
    </ReaderLayout>
  )
}
