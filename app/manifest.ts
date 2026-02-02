import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Scoop.Afrique',
    short_name: 'Scoop.Afrique',
    description: 'Le media digital qui decrypte l\'Afrique autrement. Actualite internationale, pop culture, sport, politique, economie et divertissement.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#FF3131',
    orientation: 'portrait-primary',
    categories: ['news', 'entertainment', 'lifestyle'],
    lang: 'fr',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
