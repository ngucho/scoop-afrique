import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Footer } from '@/components/footer'

const BASE_URL = 'https://scoop-afrique.com'

export const metadata: Metadata = {
  title: 'Politique de Confidentialité',
  description: 'Politique de confidentialité de Scoop Afrique. Comment nous collectons, utilisons et protégeons vos données personnelles.',
  alternates: {
    canonical: `${BASE_URL}/politique-de-confidentialite`,
  },
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
          Politique de Confidentialite
        </h1>
        <p className="mb-12 text-muted-foreground">
          Derniere mise a jour : Fevrier 2026
        </p>

        <div className="prose prose-lg prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold">1. Introduction</h2>
            <p className="text-muted-foreground">
              Scoop Afrique (&quot;nous&quot;, &quot;notre&quot;, &quot;nos&quot;) s&apos;engage à protéger la vie privée 
              de ses utilisateurs. Cette politique de confidentialité explique comment nous 
              collectons, utilisons, partageons et protégeons vos informations personnelles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">2. Informations Collectees</h2>
            <p className="text-muted-foreground">Nous pouvons collecter les types d&apos;informations suivants :</p>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
              <li><strong>Informations fournies volontairement</strong> : email lors de l&apos;inscription à la newsletter, messages via le formulaire de contact.</li>
              <li><strong>Informations collectées automatiquement</strong> : adresse IP, type de navigateur, pages visitées, temps passé sur le site (via des outils d&apos;analyse).</li>
              <li><strong>Cookies</strong> : petits fichiers stockés sur votre appareil pour améliorer votre expérience.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold">3. Utilisation des Informations</h2>
            <p className="text-muted-foreground">Nous utilisons vos informations pour :</p>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Vous envoyer notre newsletter (si vous y êtes inscrit)</li>
              <li>Répondre à vos demandes de contact</li>
              <li>Améliorer notre site et nos contenus</li>
              <li>Analyser l&apos;utilisation du site de manière anonyme</li>
              <li>Assurer la sécurité de notre plateforme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold">4. Partage des Informations</h2>
            <p className="text-muted-foreground">
              Nous ne vendons jamais vos données personnelles. Nous pouvons partager 
              des informations avec :
            </p>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Nos prestataires de services (hébergement, analytics) sous contrat de confidentialité</li>
              <li>Les autorités compétentes si la loi l&apos;exige</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold">5. Cookies</h2>
            <p className="text-muted-foreground">
              Notre site utilise des cookies pour : 
            </p>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
              <li><strong>Cookies essentiels</strong> : nécessaires au fonctionnement du site</li>
              <li><strong>Cookies analytiques</strong> : pour comprendre comment vous utilisez notre site (via des outils d&apos;analyse).</li>
              <li><strong>Cookies de préférence</strong> : pour mémoriser vos choix (thème, langue)</li>
            </ul>
            <p className="text-muted-foreground">
              Vous pouvez configurer votre navigateur pour refuser les cookies (optionnel).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">6. Securite</h2>
            <p className="text-muted-foreground">
              Nous mettons en œuvre des mesures de sécurité appropriées pour protéger 
              vos informations personnelles contre tout accès, modification, divulgation 
              ou destruction non autorisée. Notre site utilise le protocole HTTPS (optionnel).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">7. Vos Droits</h2>
            <p className="text-muted-foreground">Vous avez le droit de :</p>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Accéder à vos données personnelles</li>
              <li>Demander la rectification de vos données</li>
              <li>Demander la suppression de vos données</li>
              <li>Vous opposer au traitement de vos données</li>
              <li>Retirer votre consentement à tout moment</li>
            </ul>
            <p className="text-muted-foreground">
              Pour exercer ces droits, contactez-nous à l&apos;adresse : Contact@scoop-afrique.com
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">8. Modifications</h2>
            <p className="text-muted-foreground">
              Nous pouvons mettre à jour cette politique de confidentialité périodiquement. 
              Les modifications seront publiées sur cette page avec une date de mise à jour.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">9. Contact</h2>
            <p className="text-muted-foreground">
              Pour toute question concernant cette politique de confidentialité, 
              contactez-nous à l&apos;adresse :
            </p>
            <ul className="list-none space-y-1 text-muted-foreground">
              <li><strong>Email</strong> : Contact@scoop-afrique.com</li>
              <li><strong>Adresse</strong> : Abidjan, Côte d&apos;Ivoire</li>
            </ul>
          </section>
        </div>
      </article>

      <Footer />
    </main>
  )
}
