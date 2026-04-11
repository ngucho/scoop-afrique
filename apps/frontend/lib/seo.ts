import { config } from '@/lib/config'

const origin = config.siteUrl.replace(/\/$/, '')

/** Marque éditoriale + sites (liens de confiance pour Google / Knowledge Graph). */
export const SEO_SAME_AS = [
  origin,
  'https://www.scoop-afrique.com',
  'https://brands.scoop-afrique.com',
] as const

export function siteJsonLdGraph() {
  const orgId = `${origin}/#organization`
  const siteId = `${origin}/#website`
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Organization', 'NewsMediaOrganization'],
        '@id': orgId,
        name: 'Scoop.Afrique',
        alternateName: ['Scoop Afrique', 'SCOOP AFRIQUE', 'scoop-afrique.com'],
        url: origin,
        logo: { '@type': 'ImageObject', url: `${origin}/brand-logo.svg`, width: 607, height: 204 },
        sameAs: [...new Set(SEO_SAME_AS)],
        description:
          "Média digital panafricain : actualités, politique, économie, culture, sport et société. Produit par Scoop Afrique (rédaction & marque brands).",
      },
      {
        '@type': 'WebSite',
        '@id': siteId,
        name: 'Scoop.Afrique',
        url: origin,
        description:
          "Articles, newsletters, vidéos et podcasts — l'actualité africaine décryptée. Recherche d'articles intégrée.",
        publisher: { '@id': orgId },
        inLanguage: 'fr-FR',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${origin}/articles?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  }
}
