'use client'

import { useState } from 'react'
import { Footer } from '@/components/footer'
import { Card, Dot as DotIcon, Tabs, TabsList, TabsTrigger, TabsContent } from 'scoop'

const tabs = [
  { id: 'vision', label: 'Vision & axes' },
  { id: 'actualite', label: 'Actualité' },
  { id: 'pop-culture', label: 'Pop culture' },
  { id: 'sport', label: 'Sport' },
  { id: 'politique', label: 'Politique' },
  { id: 'economie', label: 'Économie' },
  { id: 'divertissement', label: 'Divertissement' },
  { id: 'formats', label: 'Formats & plateformes' },
]

export default function StrategieEditorialePage() {
  const [activeTab, setActiveTab] = useState('vision')

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-[var(--surface-border)] bg-[var(--surface)] py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 md:px-12 lg:px-20">
          <div className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            <DotIcon size="sm" className="text-primary" />
            Stratégie 2026
          </div>
          <h1 className="font-sans text-2xl font-bold uppercase tracking-tight text-foreground sm:text-3xl md:text-4xl">
            Notre stratégie <span className="text-primary">éditoriale</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Une feuille de route claire pour devenir le média de référence de la jeunesse africaine francophone.
            Chaque projet éditorial est développé selon des axes stratégiques précis.
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 md:px-12 lg:px-20">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8 flex flex-wrap gap-1 border-0 bg-transparent p-0">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="rounded-full border border-[var(--surface-border)] px-4 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary sm:text-sm"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="vision" className="mt-0">
              <Card className="border-[var(--surface-border)] p-6 md:p-8">
                <h2 className="mb-4 font-sans text-lg font-bold uppercase tracking-wider text-foreground">
                  Vision & axes stratégiques
                </h2>
                <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                  Devenir le média de référence de la jeunesse africaine francophone en produisant des contenus
                  audiovisuels impactants, authentiques et adaptés aux codes digitaux.
                </p>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <DotIcon size="sm" className="mt-1.5 shrink-0 text-primary" />
                    <span><strong className="text-foreground">100% Digital, 100% Africain</strong> — Ancrage local fort, équipe panafricaine, ligne éditoriale afro-centrée</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <DotIcon size="sm" className="mt-1.5 shrink-0 text-primary" />
                    <span><strong className="text-foreground">Ton éditorial distinctif</strong> — Zen, ferme, confiant, ambitieux. Décrypter l&apos;Afrique autrement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <DotIcon size="sm" className="mt-1.5 shrink-0 text-primary" />
                    <span><strong className="text-foreground">Formats viraux</strong> — Vidéos courtes, Reels, TikTok, optimisés pour chaque plateforme</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <DotIcon size="sm" className="mt-1.5 shrink-0 text-primary" />
                    <span><strong className="text-foreground">Engagement réel</strong> — Communauté active, créateurs identifiables, dialogue avec l&apos;audience</span>
                  </li>
                </ul>
              </Card>
            </TabsContent>

            <TabsContent value="actualite" className="mt-0">
              <Card className="border-[var(--surface-border)] p-6 md:p-8">
                <h2 className="mb-4 font-sans text-lg font-bold uppercase tracking-wider text-foreground">
                  Projet — Actualité internationale
                </h2>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  Les news qui impactent l&apos;Afrique et la diaspora. Décryptage rapide, vérifié, sans filtre.
                </p>
                <h3 className="mb-2 font-sans text-sm font-bold uppercase tracking-wider text-primary">Objectifs</h3>
                <ul className="mb-4 list-none space-y-1 text-sm text-muted-foreground">
                  <li>• Couvrir l&apos;actualité internationale sous l&apos;angle africain</li>
                  <li>• Priorité aux sujets qui touchent la jeunesse francophone</li>
                  <li>• Formats courts (60–90 s) pour TikTok, Reels, YouTube Shorts</li>
                </ul>
                <h3 className="mb-2 font-sans text-sm font-bold uppercase tracking-wider text-primary">Plateformes prioritaires</h3>
                <p className="text-sm text-muted-foreground">TikTok, Instagram, Facebook, YouTube</p>
              </Card>
            </TabsContent>

            <TabsContent value="pop-culture" className="mt-0">
              <Card className="border-[var(--surface-border)] p-6 md:p-8">
                <h2 className="mb-4 font-sans text-lg font-bold uppercase tracking-wider text-foreground">
                  Projet — Pop culture
                </h2>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  Musique, cinéma, mode, art. Les tendances qui font vibrer la jeunesse africaine et la diaspora.
                </p>
                <h3 className="mb-2 font-sans text-sm font-bold uppercase tracking-wider text-primary">Objectifs</h3>
                <ul className="mb-4 list-none space-y-1 text-sm text-muted-foreground">
                  <li>• Mettre en avant les artistes et créateurs africains</li>
                  <li>• Couvrir les sorties, festivals, collaborations</li>
                  <li>• Formats lifestyle, behind-the-scenes, interviews express</li>
                </ul>
                <h3 className="mb-2 font-sans text-sm font-bold uppercase tracking-wider text-primary">Plateformes prioritaires</h3>
                <p className="text-sm text-muted-foreground">TikTok, Instagram, YouTube</p>
              </Card>
            </TabsContent>

            <TabsContent value="sport" className="mt-0">
              <Card className="border-[var(--surface-border)] p-6 md:p-8">
                <h2 className="mb-4 font-sans text-lg font-bold uppercase tracking-wider text-foreground">
                  Projet — Sport
                </h2>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  Football, basketball, athlètes africains. Les performances, les transferts, les coulisses.
                </p>
                <h3 className="mb-2 font-sans text-sm font-bold uppercase tracking-wider text-primary">Objectifs</h3>
                <ul className="mb-4 list-none space-y-1 text-sm text-muted-foreground">
                  <li>• Suivre les ligues africaines et les joueurs africains en Europe</li>
                  <li>• Moments forts, réactions, analyses courtes</li>
                  <li>• Ton engagé et passionné, aligné avec la communauté</li>
                </ul>
                <h3 className="mb-2 font-sans text-sm font-bold uppercase tracking-wider text-primary">Plateformes prioritaires</h3>
                <p className="text-sm text-muted-foreground">TikTok, Instagram, Facebook, YouTube</p>
              </Card>
            </TabsContent>

            <TabsContent value="politique" className="mt-0">
              <Card className="border-[var(--surface-border)] p-6 md:p-8">
                <h2 className="mb-4 font-sans text-lg font-bold uppercase tracking-wider text-foreground">
                  Projet — Politique
                </h2>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  Décryptage des enjeux du continent. Élections, gouvernance, géopolitique africaine.
                </p>
                <h3 className="mb-2 font-sans text-sm font-bold uppercase tracking-wider text-primary">Objectifs</h3>
                <ul className="mb-4 list-none space-y-1 text-sm text-muted-foreground">
                  <li>• Rendre la politique accessible à la jeunesse</li>
                  <li>• Expliquer les enjeux sans jargon, avec pédagogie</li>
                  <li>• Formats explicatifs, infographies, résumés</li>
                </ul>
                <h3 className="mb-2 font-sans text-sm font-bold uppercase tracking-wider text-primary">Plateformes prioritaires</h3>
                <p className="text-sm text-muted-foreground">TikTok, Instagram, Facebook, YouTube</p>
              </Card>
            </TabsContent>

            <TabsContent value="economie" className="mt-0">
              <Card className="border-[var(--surface-border)] p-6 md:p-8">
                <h2 className="mb-4 font-sans text-lg font-bold uppercase tracking-wider text-foreground">
                  Projet — Économie
                </h2>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  Business, tech, entrepreneuriat africain. Les startups, les tendances, les success stories.
                </p>
                <h3 className="mb-2 font-sans text-sm font-bold uppercase tracking-wider text-primary">Objectifs</h3>
                <ul className="mb-4 list-none space-y-1 text-sm text-muted-foreground">
                  <li>• Inspirer la jeunesse avec des parcours d&apos;entrepreneurs</li>
                  <li>• Décrypter l&apos;écosystème tech et finance africain</li>
                  <li>• Formats courts, témoignages, chiffres clés</li>
                </ul>
                <h3 className="mb-2 font-sans text-sm font-bold uppercase tracking-wider text-primary">Plateformes prioritaires</h3>
                <p className="text-sm text-muted-foreground">TikTok, Instagram, LinkedIn, YouTube</p>
              </Card>
            </TabsContent>

            <TabsContent value="divertissement" className="mt-0">
              <Card className="border-[var(--surface-border)] p-6 md:p-8">
                <h2 className="mb-4 font-sans text-lg font-bold uppercase tracking-wider text-foreground">
                  Projet — Divertissement
                </h2>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  Buzz, tendances, lifestyle africain. Le contenu qui fait sourire et partager.
                </p>
                <h3 className="mb-2 font-sans text-sm font-bold uppercase tracking-wider text-primary">Objectifs</h3>
                <ul className="mb-4 list-none space-y-1 text-sm text-muted-foreground">
                  <li>• Créer du contenu viral et engageant</li>
                  <li>• Micro-trottoirs, réactions, tendances du moment</li>
                  <li>• Équilibre entre info et divertissement</li>
                </ul>
                <h3 className="mb-2 font-sans text-sm font-bold uppercase tracking-wider text-primary">Plateformes prioritaires</h3>
                <p className="text-sm text-muted-foreground">TikTok, Instagram, Facebook</p>
              </Card>
            </TabsContent>

            <TabsContent value="formats" className="mt-0">
              <Card className="border-[var(--surface-border)] p-6 md:p-8">
                <h2 className="mb-4 font-sans text-lg font-bold uppercase tracking-wider text-foreground">
                  Formats & plateformes
                </h2>
                <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                  Chaque plateforme a ses codes. Notre stratégie : adapter le contenu sans perdre notre identité.
                </p>
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-2 font-sans text-sm font-bold uppercase tracking-wider text-primary">TikTok (priorité 2026)</h3>
                    <p className="text-sm text-muted-foreground">
                      +36 points de pénétration en Côte d&apos;Ivoire (2023→2025). Formats 60–90 s, duos, tendances.
                      34h56/mois par utilisateur. Priorité absolue.
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-2 font-sans text-sm font-bold uppercase tracking-wider text-primary">YouTube</h3>
                    <p className="text-sm text-muted-foreground">
                      27h10/mois. Formats longs pour le décryptage, Shorts pour la viralité. Monétisation plus facile.
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-2 font-sans text-sm font-bold uppercase tracking-wider text-primary">Instagram</h3>
                    <p className="text-sm text-muted-foreground">
                      Reels, Stories, carrousels. Bon ROI publicitaire. Audience mature.
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-2 font-sans text-sm font-bold uppercase tracking-wider text-primary">Facebook</h3>
                    <p className="text-sm text-muted-foreground">
                      #1 en volume (80% pénétration). Stagnation mais base large. Formats partageables.
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Footer />
    </main>
  )
}
