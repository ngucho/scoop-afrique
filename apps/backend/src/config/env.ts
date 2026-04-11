/**
 * Backend environment configuration — validated with Zod.
 *
 * Database: DATABASE_URL (pooler) — Drizzle ORM, parameterized queries (SQL injection safe)
 * Storage:  SUPABASE_SERVICE_ROLE_KEY — Supabase Storage API (URL derived from DATABASE_URL)
 * Auth0:    AUTH0_DOMAIN, AUTH0_AUDIENCE
 */
import { z } from 'zod'

/** Extract Supabase project ref from pooler URL: postgresql://postgres.REF@host/postgres */
function projectRefFromDatabaseUrl(url: string): string | null {
  try {
    const m = url.match(/postgres(?:ql)?:\/\/[^/]*?\.([a-z0-9]+)@/i) || url.match(/postgres(?:ql)?:\/\/postgres\.([a-z0-9]+)@/i)
    return m ? m[1] : null
  } catch {
    return null
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().min(1).max(65535).default(4000),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000,http://localhost:3001,http://localhost:3002')
    .transform((s) => s.split(',').map((x) => x.trim())),
  API_PREFIX: z.string().default('/api/v1'),

  // Database — pooler URL (Supabase Connect dialog → PostgreSQL → URI)
  DATABASE_URL: z.string().min(1).optional(),

  // Storage — Supabase service role key (for Storage API only; URL derived from DATABASE_URL)
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // Legacy — fallback if DATABASE_URL not set (deprecated)
  SUPABASE_URL: z.string().url().optional(),

  // Auth0 (IAM — sole identity provider). Domain = hostname only, e.g. tenant.auth0.com
  AUTH0_DOMAIN: z
    .string()
    .min(1)
    .optional()
    .transform((s) =>
      s
        ? s.replace(/^https?:\/\//i, '').replace(/\/+$/, '').trim()
        : undefined
    ),
  AUTH0_AUDIENCE: z.string().min(1).optional(),
  /** Auth0 "Reader" SPA client ID — JWT `azp` claim; staff routes reject tokens from this app. */
  AUTH0_READER_CLIENT_ID: z.string().min(1).optional(),

  // Auth0 Management API (M2M app for user_metadata, password). Either set these or AUTH0_CLIENT_ID / AUTH0_CLIENT_SECRET.
  AUTH0_MANAGEMENT_CLIENT_ID: z.string().min(1).optional(),
  AUTH0_MANAGEMENT_CLIENT_SECRET: z.string().min(1).optional(),
  AUTH0_CLIENT_ID: z.string().min(1).optional(),
  AUTH0_CLIENT_SECRET: z.string().min(1).optional(),

  // Resend (email for devis notifications)
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  NOTIFICATION_EMAIL: z.string().optional(), // comma-separated emails for devis/invoice alerts
  /** Resend webhook signing secret (Svix) for delivery events */
  RESEND_WEBHOOK_SECRET: z.string().min(1).optional(),
  /** Shared secret for cron / internal job HTTP triggers */
  DIGEST_CRON_SECRET: z.string().min(1).optional(),
  /** Public reader site base URL (for digest links, unsubscribe). */
  PUBLIC_SITE_URL: z.string().url().optional(),

  // Twilio (WhatsApp + SMS for notifications)
  TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
  TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
  TWILIO_WHATSAPP_FROM: z.string().min(1).optional(), // e.g. whatsapp:+1234567890
  TWILIO_WHATSAPP_TO: z.string().min(1).optional(),   // team WhatsApp number
  TWILIO_SMS_TO: z.string().min(1).optional(),       // team SMS number (optional, for devis alerts)

  /** ImgBB API key — optional; used to host large compressed images from the media library */
  IMGBB_API_KEY: z.string().min(1).optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment:', parsed.error.flatten())
  throw new Error('Invalid environment configuration')
}

const env = parsed.data

const supabaseUrl =
  env.SUPABASE_URL ||
  (env.DATABASE_URL && projectRefFromDatabaseUrl(env.DATABASE_URL)
    ? `https://${projectRefFromDatabaseUrl(env.DATABASE_URL)}.supabase.co`
    : null)

export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  corsOrigins: env.CORS_ORIGINS,
  apiPrefix: env.API_PREFIX,

  database:
    env.DATABASE_URL
      ? { url: env.DATABASE_URL }
      : null,

  supabase:
    supabaseUrl && env.SUPABASE_SERVICE_ROLE_KEY
      ? { url: supabaseUrl, serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY }
      : null,

  auth0:
    env.AUTH0_DOMAIN && env.AUTH0_AUDIENCE
      ? { domain: env.AUTH0_DOMAIN, audience: env.AUTH0_AUDIENCE }
      : null,

  auth0Reader: env.AUTH0_READER_CLIENT_ID ? { clientId: env.AUTH0_READER_CLIENT_ID } : null,

  auth0Management:
    env.AUTH0_DOMAIN &&
    (env.AUTH0_MANAGEMENT_CLIENT_ID ?? env.AUTH0_CLIENT_ID) &&
    (env.AUTH0_MANAGEMENT_CLIENT_SECRET ?? env.AUTH0_CLIENT_SECRET)
      ? {
          domain: env.AUTH0_DOMAIN,
          clientId: env.AUTH0_MANAGEMENT_CLIENT_ID ?? env.AUTH0_CLIENT_ID!,
          clientSecret: env.AUTH0_MANAGEMENT_CLIENT_SECRET ?? env.AUTH0_CLIENT_SECRET!,
          audience: `https://${env.AUTH0_DOMAIN}/api/v2/`,
        }
      : null,

  resend:
    env.RESEND_API_KEY
      ? {
          apiKey: env.RESEND_API_KEY,
          fromEmail: env.RESEND_FROM_EMAIL,
          notificationEmails: env.NOTIFICATION_EMAIL
            ? env.NOTIFICATION_EMAIL.split(',').map((e) => e.trim()).filter(Boolean)
            : ['contact@scoop-afrique.com'],
          webhookSecret: env.RESEND_WEBHOOK_SECRET ?? null,
        }
      : null,

  digestCronSecret: env.DIGEST_CRON_SECRET ?? null,

  publicSiteUrl: env.PUBLIC_SITE_URL ?? null,

  twilio:
    env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_WHATSAPP_FROM && env.TWILIO_WHATSAPP_TO
      ? {
          accountSid: env.TWILIO_ACCOUNT_SID,
          authToken: env.TWILIO_AUTH_TOKEN,
          whatsappFrom: env.TWILIO_WHATSAPP_FROM,
          whatsappTo: env.TWILIO_WHATSAPP_TO,
          smsTo: env.TWILIO_SMS_TO ?? env.TWILIO_WHATSAPP_TO,
          smsFrom: env.TWILIO_WHATSAPP_FROM.replace(/^whatsapp:/i, ''),
        }
      : null,

  imgbb: env.IMGBB_API_KEY ? { apiKey: env.IMGBB_API_KEY } : null,
} as const

export function assertConfig(): void {
  if (config.database === null && config.nodeEnv === 'production') {
    throw new Error('DATABASE_URL is required in production (pooler from Supabase Connect dialog)')
  }
  if (config.supabase === null && config.nodeEnv === 'production') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for Storage (URL derived from DATABASE_URL)')
  }
  if (config.auth0 === null && config.nodeEnv === 'production') {
    throw new Error('AUTH0_DOMAIN and AUTH0_AUDIENCE are required in production')
  }
}
