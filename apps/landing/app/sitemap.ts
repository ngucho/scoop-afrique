import type { MetadataRoute } from 'next'

const BASE_URL = 'https://www.scoop-afrique.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date().toISOString()
  return [
    { url: BASE_URL, lastModified: currentDate, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/a-propos`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/contact`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/politique-de-confidentialite`, lastModified: currentDate, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/mentions-legales`, lastModified: currentDate, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
