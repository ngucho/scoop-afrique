import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Footer } from '@/components/footer'
import { Heading } from 'scoop'
import { backLinkClassName } from '@/lib/landing'

const BASE_URL = 'https://www.scoop-afrique.com'

export const metadata: Metadata = {
  title: 'Politique de Confidentialité',
  description:
    'Politique de confidentialité de Scoop Afrique. Comment nous collectons, utilisons et protégeons vos données personnelles.',
  alternates: { canonical: `${BASE_URL}/politique-de-confidentialite` },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/politique-de-confidentialite`,
    title: 'Politique de Confidentialité | Scoop Afrique',
    description: 'Politique de confidentialité de Scoop Afrique. Données personnelles et cookies.',
    siteName: 'Scoop Afrique',
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Scoop Afrique' }],
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <Link href="/" className={backLinkClassName}>
            <span aria-hidden />
            <ArrowLeft className="mr-2 inline-block h-4 w-4" />
            Retour à l&apos;accueil
          </Link>
        </div>
      </header>
      <article className="mx-auto max-w-4xl px-6 py-16">
        <Heading as="h1" level="h1" className="mb-4">Politique de Confidentialité</Heading>
        <p className="mb-12 text-muted-foreground">Dernière mise à jour : Février 2026</p>
        <div className="space-y-8">
          <section>
            <Heading as="h2" level="h2" className="mb-2">1. Introduction</Heading>
            <p className="text-muted-foreground">
              Scoop Afrique s&apos;engage à protéger la vie privée de ses utilisateurs. Cette politique explique comment nous collectons, utilisons, partageons et protégeons vos informations personnelles.
            </p>
          </section>
          <section>
            <Heading as="h2" level="h2" className="mb-2">2. Informations collectées</Heading>
            <p className="text-muted-foreground mb-2">Nous pouvons collecter :</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Informations fournies volontairement : nom, prénom, adresse e-mail, message, objet de votre demande (partenariat, publicité, presse, etc.)</li>
              <li>Informations collectées automatiquement : adresse IP, type de navigateur, pages visitées, durée de visite</li>
              <li>Cookies et technologies similaires (voir section Cookies)</li>
            </ul>
          </section>
          <section>
            <Heading as="h2" level="h2" className="mb-2">3. Utilisation des informations</Heading>
            <p className="text-muted-foreground">Vos données sont utilisées pour : vous envoyer la newsletter si vous y souscrivez, répondre à vos demandes de contact et de devis, améliorer le site et l&apos;expérience utilisateur, analyser l&apos;utilisation du site de manière agrégée, assurer la sécurité et le bon fonctionnement des services.</p>
          </section>
          <section>
            <Heading as="h2" level="h2" className="mb-2">4. Partage des informations</Heading>
            <p className="text-muted-foreground">Nous ne vendons jamais vos données. Nous pouvons partager avec des prestataires sous contrat de confidentialité ou les autorités si la loi l&apos;exige.</p>
          </section>
          <section>
            <Heading as="h2" level="h2" className="mb-2">5. Cookies</Heading>
            <p className="text-muted-foreground">Cookies essentiels, analytiques et de préférence. Vous pouvez configurer votre navigateur pour refuser les cookies.</p>
          </section>
          <section>
            <Heading as="h2" level="h2" className="mb-2">6. Sécurité</Heading>
            <p className="text-muted-foreground">Mesures de sécurité appropriées et protocole HTTPS.</p>
          </section>
          <section>
            <Heading as="h2" level="h2" className="mb-2">7. Vos droits</Heading>
            <p className="text-muted-foreground mb-2">Conformément à la réglementation applicable (RGPD pour les résidents de l&apos;UE, lois locales pour la Côte d&apos;Ivoire et l&apos;Afrique), vous disposez notamment des droits suivants : droit d&apos;accès à vos données, droit de rectification, droit à l&apos;effacement, droit à la limitation du traitement, droit d&apos;opposition, droit au retrait du consentement. Pour les exercer : Contact@scoop-afrique.com. Nous nous engageons à répondre dans un délai raisonnable.</p>
          </section>
          <section>
            <Heading as="h2" level="h2" className="mb-2">8. Modifications</Heading>
            <p className="text-muted-foreground">Mises à jour publiées sur cette page avec date de mise à jour.</p>
          </section>
          <section>
            <Heading as="h2" level="h2" className="mb-2">9. Contact</Heading>
            <p className="text-muted-foreground">Email : Contact@scoop-afrique.com — Adresse : Abidjan, Côte d&apos;Ivoire</p>
          </section>
        </div>
      </article>
      <Footer />
    </main>
  )
}
