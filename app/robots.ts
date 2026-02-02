import type { MetadataRoute } from 'next'

const BASE_URL = 'https://scoop-afrique.com'

/**
 * robots.txt généré dynamiquement — accessible en GET /robots.txt
 * Réponse HTTP 200, pas d’auth, pas de redirection.
 * Référence : https://www.robotstxt.org/
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/', '/admin/', '/private/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
