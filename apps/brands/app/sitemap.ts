import type { MetadataRoute } from 'next'
import { getAllServiceSlugs } from '@/lib/services-data'

const BASE_URL = 'https://www.scoop-afrique.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date().toISOString()
  const serviceUrls = getAllServiceSlugs().map((slug) => ({
    url: `${BASE_URL}/services/${slug}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))
  return [
    { url: BASE_URL, lastModified: currentDate, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/a-propos`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/strategie-editoriale`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/services`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.8 },
    ...serviceUrls,
    { url: `${BASE_URL}/tarifs`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/realisations`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/faq`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/contact`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/demander-devis`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/politique-de-confidentialite`, lastModified: currentDate, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/mentions-legales`, lastModified: currentDate, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
