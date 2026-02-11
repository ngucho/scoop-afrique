/**
 * Frontend config (env). Never expose backend secrets here.
 * Use NEXT_PUBLIC_* only for client-safe values.
 */
const env = process.env

export const config = {
  /** Backend API base URL (server or client). Prefer server-side only for secrets. */
  apiBaseUrl: env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  /** Public site URL for links/canonicals */
  siteUrl: env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001',
} as const
