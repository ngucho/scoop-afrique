import type { MetadataRoute } from 'next'

const BASE_URL = 'https://www.scoop-afrique.com'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Scoop.Afrique - Le media digital qui decrypte l'Afrique autrement",
    short_name: 'Scoop.Afrique',
    description:
      "Scoop Afrique est le media digital africain nouvelle generation. Actualite internationale, pop culture, sport, politique, economie et divertissement. Plus de 1,25 million d'abonnes nous font confiance. Base a Abidjan, Cote d'Ivoire.",
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#FF3131',
    orientation: 'portrait-primary',
    categories: ['news', 'entertainment', 'lifestyle', 'media', 'tv', 'radio', 'podcast', 'video', 'music'],
    lang: 'fr',
    scope: '/',
    id: `${BASE_URL}/`,
    icons: [
      { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    screenshots: [
      { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', label: 'Scoop.Afrique', form_factor: 'narrow' },
      { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', label: 'Scoop.Afrique', form_factor: 'wide' },
    ],
    keywords: [
      'Scoop Afrique',
      'Scoop.Afrique',
      'media africain',
      'actualite Afrique',
      'news Afrique',
      "Cote d'Ivoire",
      'Abidjan',
      'Afrique francophone',
      'pop culture africaine',
      'sport africain',
      'divertissement Afrique',
      'media digital',
      'actualite internationale',
      'info Afrique',
    ],
  } as MetadataRoute.Manifest
}
