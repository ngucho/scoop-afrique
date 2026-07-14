import type { Metadata } from 'next'
import { Footer } from '@/components/footer'
import { Heading, Card, Dot } from 'scoop'
import { CtaButton } from '@/components/cta-button'
import { wwwPath } from '@/lib/site-urls'

const BASE_URL = 'https://brands.scoop-afrique.com'

export const metadata: Metadata = {
  title: 'Realisations & preuves',
  description:
    'Realisations Scoop Afrique : references CRM, entreprises accompagnees, projets associes et chiffres audience 2026.',
  alternates: { canonical: `${BASE_URL}/realisations` },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/realisations`,
    title: 'Realisations | Scoop Afrique',
    description: 'Portfolio, references clients et projets associes.',
    siteName: 'Scoop Afrique',
    images: [{ url: `${BASE_URL}/images/hero-brands.png`, width: 1200, height: 630, alt: 'Scoop Afrique Realisations' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Realisations | Scoop Afrique',
    description: 'Preuves & references clients.',
    images: ['/images/hero-brands.png'],
  },
}

const proofs = [
  {
    client: 'NCI',
    type: 'Media - Coupe du Monde 2026',
    quote: 'Collaboration avec le diffuseur officiel en Cote d Ivoire : contenus et relais autour de la Coupe du Monde 2026.',
    initials: 'NCI',
  },
  {
    client: 'Miss Natural Beauty CI',
    type: 'Partenariat - Edition 2026',
    quote:
      'Dispositif mixte : publications sponsorisees mensuelles, couverture de finale, visibilite officielle et accreditations presse.',
    initials: 'MN',
  },
  {
    client: 'Concerto',
    type: 'Entertainment - The Voice / Fan zone',
    quote: 'Annonces, presentation de coachs et activations evenementielles pour installer des rendez-vous culturels.',
    initials: 'CO',
  },
  {
    client: "Ministere de la Femme, de la Famille et de l'Enfant CI",
    type: 'Institution - VBG',
    quote: 'Relais autour de l engagement national contre les VBG, avec un angle de mobilisation citoyenne.',
    initials: 'CI',
  },
]

const crmProjects = [
  {
    company: 'BIFA Institute',
    project: "PM4NGOs Cote d'Ivoire",
    detail: 'Campagne formation et visibilite professionnelle.',
  },
  {
    company: 'Africa publicity',
    project: 'Promo concert evenement',
    detail: 'Activation courte pour pousser une date et son audience.',
  },
  {
    company: 'Chloe Ricci',
    project: 'Promotion boxe anglaise a Abidjan',
    detail: 'Mise en avant sportive autour d un combat au Parc des Expositions.',
  },
  {
    company: 'Amadou Lamarana Bah',
    project: 'Interview reportage',
    detail: 'Format editorial long pour donner du contexte et de la profondeur.',
  },
]

const stats = [
  { value: '+1,4 M', label: 'Abonnes cumules' },
  { value: '910 K', label: 'TikTok' },
  { value: '12+', label: 'Pays' },
  { value: '5+', label: 'Reseaux actifs' },
]

export default function RealisationsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border bg-card py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            <Dot size="sm" className="text-primary" />
            Portfolio CRM
          </div>
          <Heading as="h1" level="h1" className="mt-4 mb-6">
            Nos <span className="text-primary">realisations</span>
          </Heading>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Quelques preuves issues du CRM Scoop Afrique et du media kit 2026 : entreprises, institutions et projets de
            reference, avec le media public visible sur{' '}
            <a href={wwwPath('/')} className="text-primary underline-offset-4 hover:underline" target="_blank" rel="noopener noreferrer">
              scoop-afrique.com
            </a>
            .
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Source : CRM Supabase + analytics internes plateformes.</p>
          <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-sans text-2xl font-black text-primary md:text-3xl">{stat.value}</div>
                <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-muted/20 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">Ils nous ont fait confiance</h2>
          <p className="mb-10 font-sans text-2xl font-black uppercase tracking-tight text-foreground md:text-3xl">
            Entreprises & <span className="text-primary">projets verifies</span>
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            {proofs.map((p) => (
              <Card key={p.client} className="flex flex-col border-border p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-background font-brasika text-lg font-black text-primary">
                  {p.initials}
                </div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{p.type}</p>
                <h3 className="mt-1 font-sans text-base font-bold text-foreground">{p.client}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">&ldquo;{p.quote}&rdquo;</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">Autres references CRM</h2>
          <p className="mb-12 font-sans text-3xl font-black uppercase tracking-tight text-foreground md:text-4xl">
            Projets <span className="text-primary">associes</span>
          </p>
          <div className="grid gap-5 md:grid-cols-2">
            {crmProjects.map((r) => (
              <Card key={`${r.company}-${r.project}`} className="border-border p-6 transition-shadow hover:shadow-lg">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-primary">{r.company}</p>
                    <h3 className="mt-2 font-sans text-xl font-bold uppercase tracking-wider text-foreground">{r.project}</h3>
                  </div>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{r.detail}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card py-16">
        <div className="mx-auto max-w-6xl px-6 text-center md:px-12">
          <p className="mb-6 text-muted-foreground">
            Suivez le fil editorial en direct ou lancez un brief : meme equipe, deux entrees selon votre besoin.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <CtaButton href={wwwPath('/')} variant="outline" external>
              Lire scoop-afrique.com
            </CtaButton>
            <CtaButton href="/demander-devis" variant="fillHover">
              Demander un devis
            </CtaButton>
            <CtaButton href="https://www.tiktok.com/@Scoop.Afrique" variant="outline" external>
              TikTok
            </CtaButton>
            <CtaButton href="https://www.instagram.com/Scoop.Afrique" variant="outline" external>
              Instagram
            </CtaButton>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
