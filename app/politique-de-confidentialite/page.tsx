import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Footer } from '@/components/footer'

const BASE_URL = 'https://scoop-afrique.com'

export const metadata: Metadata = {
  title: 'Politique de Confidentialite',
  description: 'Politique de confidentialite de Scoop.Afrique. Comment nous collectons, utilisons et protegeons vos donnees personnelles.',
  alternates: {
    canonical: `${BASE_URL}/politique-de-confidentialite`,
  },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/politique-de-confidentialite`,
    title: 'Politique de Confidentialite | Scoop.Afrique',
    description: 'Politique de confidentialite de Scoop.Afrique. Donnees personnelles et cookies.',
    siteName: 'Scoop.Afrique',
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Scoop.Afrique' }],
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
              Scoop.Afrique (&quot;nous&quot;, &quot;notre&quot;, &quot;nos&quot;) s&apos;engage a proteger la vie privee 
              de ses utilisateurs. Cette politique de confidentialite explique comment nous 
              collectons, utilisons, partageons et protegeons vos informations personnelles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">2. Informations Collectees</h2>
            <p className="text-muted-foreground">Nous pouvons collecter les types d&apos;informations suivants :</p>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
              <li><strong>Informations fournies volontairement</strong> : email lors de l&apos;inscription a la newsletter, messages via le formulaire de contact.</li>
              <li><strong>Informations collectees automatiquement</strong> : adresse IP, type de navigateur, pages visitees, temps passe sur le site (via des outils d&apos;analyse).</li>
              <li><strong>Cookies</strong> : petits fichiers stockes sur votre appareil pour ameliorer votre experience.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold">3. Utilisation des Informations</h2>
            <p className="text-muted-foreground">Nous utilisons vos informations pour :</p>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Vous envoyer notre newsletter (si vous y etes inscrit)</li>
              <li>Repondre a vos demandes de contact</li>
              <li>Ameliorer notre site et nos contenus</li>
              <li>Analyser l&apos;utilisation du site de maniere anonyme</li>
              <li>Assurer la securite de notre plateforme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold">4. Partage des Informations</h2>
            <p className="text-muted-foreground">
              Nous ne vendons jamais vos donnees personnelles. Nous pouvons partager 
              des informations avec :
            </p>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Nos prestataires de services (hebergement, analytics) sous contrat de confidentialite</li>
              <li>Les autorites competentes si la loi l&apos;exige</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold">5. Cookies</h2>
            <p className="text-muted-foreground">
              Notre site utilise des cookies pour :
            </p>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
              <li><strong>Cookies essentiels</strong> : necessaires au fonctionnement du site</li>
              <li><strong>Cookies analytiques</strong> : pour comprendre comment vous utilisez notre site</li>
              <li><strong>Cookies de preference</strong> : pour memoriser vos choix (theme, langue)</li>
            </ul>
            <p className="text-muted-foreground">
              Vous pouvez configurer votre navigateur pour refuser les cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">6. Securite</h2>
            <p className="text-muted-foreground">
              Nous mettons en oeuvre des mesures de securite appropriees pour proteger 
              vos informations personnelles contre tout acces, modification, divulgation 
              ou destruction non autorisee. Notre site utilise le protocole HTTPS.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">7. Vos Droits</h2>
            <p className="text-muted-foreground">Vous avez le droit de :</p>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Acceder a vos donnees personnelles</li>
              <li>Demander la rectification de vos donnees</li>
              <li>Demander la suppression de vos donnees</li>
              <li>Vous opposer au traitement de vos donnees</li>
              <li>Retirer votre consentement a tout moment</li>
            </ul>
            <p className="text-muted-foreground">
              Pour exercer ces droits, contactez-nous a : Contact@scoop-afrique.com
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">8. Modifications</h2>
            <p className="text-muted-foreground">
              Nous pouvons mettre a jour cette politique de confidentialite periodiquement. 
              Les modifications seront publiees sur cette page avec une date de mise a jour.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">9. Contact</h2>
            <p className="text-muted-foreground">
              Pour toute question concernant cette politique de confidentialite, 
              contactez-nous a :
            </p>
            <ul className="list-none space-y-1 text-muted-foreground">
              <li><strong>Email</strong> : Contact@scoop-afrique.com</li>
              <li><strong>Adresse</strong> : Abidjan, Cote d&apos;Ivoire</li>
            </ul>
          </section>
        </div>
      </article>

      <Footer />
    </main>
  )
}
