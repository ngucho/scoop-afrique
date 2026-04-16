/**
 * Images distantes : tous les hôtes HTTPS/HTTP autorisés pour `next/image`.
 * (Les motifs utilisent picomatch — `**` couvre n’importe quel hostname.)
 *
 * Attention : l’optimiseur Next peut être sollicité pour n’importe quelle URL publique ;
 * en production, surveillez l’usage si besoin (coût / abus).
 */
const imageRemotePatterns = [
  { protocol: 'https', hostname: '**', pathname: '/**' },
  { protocol: 'http', hostname: '**', pathname: '/**' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['scoop'],
  typescript: { ignoreBuildErrors: false },
  /** Crawlers & browsers request /favicon.ico by default; we only ship app/icon.svg → /icon.svg */
  async rewrites() {
    return [{ source: '/favicon.ico', destination: '/icon.svg' }]
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: imageRemotePatterns,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@tabler/icons-react'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig
