import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { LegalNav } from '@/components/legal/LegalNav'
import { Heading } from 'scoop'

export const metadata: Metadata = {
  title: 'Conditions générales d’utilisation',
  description:
    "CGU du site Scoop.Afrique : règles d'accès, propriété intellectuelle, comptes, responsabilité et droit applicable.",
}

const backLinkClass =
  'inline-flex items-center gap-2 text-sm text-foreground transition-colors hover:text-primary'

export default function CguPage() {
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
            Conditions générales d&apos;utilisation (CGU)
          </Heading>
          <p className="mb-12 text-muted-foreground">Dernière mise à jour : avril 2026</p>
          <div className="space-y-8">
            <section>
              <Heading as="h2" level="h2" className="mb-2">
                1. Objet et acceptation
              </Heading>
              <p className="text-muted-foreground">
                Les présentes CGU régissent l&apos;accès et l&apos;utilisation du site{' '}
                <strong>Scoop.Afrique</strong> (ci-après « le Site »), édité par <strong>SCOOP AFRIQUE</strong>. En
                naviguant sur le Site, vous acceptez sans réserve les présentes conditions. Si vous n&apos;y consentez
                pas, veuillez ne pas utiliser le Site.
              </p>
            </section>
            <section>
              <Heading as="h2" level="h2" className="mb-2">
                2. Accès au service
              </Heading>
              <p className="text-muted-foreground">
                Le Site est accessible en lecture libre sous réserve de la disponibilité technique. L&apos;éditeur peut
                modifier, suspendre ou interrompre tout ou partie du Site à tout moment. Certaines fonctionnalités
                (compte lecteur, newsletter, contributions) peuvent nécessiter la création d&apos;un compte ou la
                fourniture d&apos;informations personnelles conformément à notre{' '}
                <Link href="/politique-de-confidentialite" className="text-primary hover:underline">
                  Politique de confidentialité
                </Link>
                .
              </p>
            </section>
            <section>
              <Heading as="h2" level="h2" className="mb-2">
                3. Comportement des utilisateurs
              </Heading>
              <p className="mb-2 text-muted-foreground">Vous vous engagez à ne pas :</p>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                <li>porter atteinte aux droits de tiers ou aux lois en vigueur ;</li>
                <li>diffuser des contenus illicites, diffamatoires, haineux ou trompeurs ;</li>
                <li>tenter d&apos;accéder de manière non autorisée à nos systèmes, comptes ou données ;</li>
                <li>extraire massivement des données du Site sans accord écrit (scraping abusif).</li>
              </ul>
              <p className="mt-2 text-muted-foreground">
                L&apos;éditeur se réserve le droit de retirer tout contenu généré par les utilisateurs (commentaires,
                contributions, profils) et de suspendre ou supprimer un compte en cas de manquement grave.
              </p>
            </section>
            <section>
              <Heading as="h2" level="h2" className="mb-2">
                4. Propriété intellectuelle
              </Heading>
              <p className="text-muted-foreground">
                Les articles, visuels, logos, marques, podcasts, vidéos et bases de données publiés sur le Site sont
                protégés. Toute reproduction, représentation ou exploitation non autorisée est interdite sauf usage
                privé ou courte citation avec mention de la source et du lien, dans les limites prévues par la loi.
              </p>
            </section>
            <section>
              <Heading as="h2" level="h2" className="mb-2">
                5. Liens et services tiers
              </Heading>
              <p className="text-muted-foreground">
                Le Site peut renvoyer vers des sites ou services tiers (réseaux sociaux, partenaires). Leur utilisation
                relève de leurs propres conditions ; l&apos;éditeur n&apos;en contrôle pas le contenu.
              </p>
            </section>
            <section>
              <Heading as="h2" level="h2" className="mb-2">
                6. Limitation de responsabilité
              </Heading>
              <p className="text-muted-foreground">
                Les informations publiées le sont à titre informatif. L&apos;éditeur ne garantit pas l&apos;absence
                d&apos;erreurs ni l&apos;adéquation à un usage particulier. La responsabilité de l&apos;éditeur ne saurait
                être engagée pour des dommages indirects ou pour une utilisation du Site non conforme aux présentes CGU.
              </p>
            </section>
            <section>
              <Heading as="h2" level="h2" className="mb-2">
                7. Newsletter et offres
              </Heading>
              <p className="text-muted-foreground">
                L&apos;inscription à la newsletter est facultative et régie par une confirmation par e-mail (double
                opt-in). Vous pouvez vous désinscrire à tout moment. Les offres commerciales ou partenariales présentées
                sur des pages dédiées (ex. espace annonceurs) sont soumises à leurs conditions spécifiques.
              </p>
            </section>
            <section>
              <Heading as="h2" level="h2" className="mb-2">
                8. Droit applicable et litiges
              </Heading>
              <p className="text-muted-foreground">
                Les présentes CGU sont soumises au droit en vigueur en Côte d&apos;Ivoire. À défaut de résolution
                amiable, les tribunaux compétents d&apos;Abidjan sont seuls attributaires des litiges relatifs au Site.
              </p>
            </section>
            <section>
              <Heading as="h2" level="h2" className="mb-2">
                9. Contact
              </Heading>
              <p className="text-muted-foreground">
                Pour toute question relative aux présentes CGU :{' '}
                <a href="mailto:Contact@scoop-afrique.com" className="text-primary hover:underline">
                  Contact@scoop-afrique.com
                </a>
              </p>
            </section>
          </div>
          <LegalNav current="cgu" />
        </article>
      </main>
    </ReaderLayout>
  )
}
