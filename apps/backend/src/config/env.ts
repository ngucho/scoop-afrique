/**
 * Backend environment configuration — validated with Zod.
 *
 * Required in production: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Auth0 (IAM):            AUTH0_DOMAIN, AUTH0_AUDIENCE
 */
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().min(1).max(65535).default(4000),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000,http://localhost:3001,http://localhost:3002')
    .transform((s) => s.split(',').map((x) => x.trim())),
  API_PREFIX: z.string().default('/api/v1'),

  // Supabase
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

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

  // Auth0 Management API (M2M app for user_metadata, password). Either set these or AUTH0_CLIENT_ID / AUTH0_CLIENT_SECRET.
  AUTH0_MANAGEMENT_CLIENT_ID: z.string().min(1).optional(),
  AUTH0_MANAGEMENT_CLIENT_SECRET: z.string().min(1).optional(),
  AUTH0_CLIENT_ID: z.string().min(1).optional(),
  AUTH0_CLIENT_SECRET: z.string().min(1).optional(),

  // Resend (email for devis notifications)
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),

  // Twilio (WhatsApp for devis notifications)
  TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
  TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
  TWILIO_WHATSAPP_FROM: z.string().min(1).optional(), // e.g. whatsapp:+1234567890
  TWILIO_WHATSAPP_TO: z.string().min(1).optional(),   // team WhatsApp number
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment:', parsed.error.flatten())
  throw new Error('Invalid environment configuration')
}

const env = parsed.data

export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  corsOrigins: env.CORS_ORIGINS,
  apiPrefix: env.API_PREFIX,

  supabase:
    env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
      ? { url: env.SUPABASE_URL, serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY }
      : null,

  auth0:
    env.AUTH0_DOMAIN && env.AUTH0_AUDIENCE
      ? { domain: env.AUTH0_DOMAIN, audience: env.AUTH0_AUDIENCE }
      : null,

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
      ? { apiKey: env.RESEND_API_KEY, fromEmail: env.RESEND_FROM_EMAIL }
      : null,

  twilio:
    env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_WHATSAPP_FROM && env.TWILIO_WHATSAPP_TO
      ? {
          accountSid: env.TWILIO_ACCOUNT_SID,
          authToken: env.TWILIO_AUTH_TOKEN,
          whatsappFrom: env.TWILIO_WHATSAPP_FROM,
          whatsappTo: env.TWILIO_WHATSAPP_TO,
        }
      : null,
} as const

export function assertConfig(): void {
  if (config.supabase === null && config.nodeEnv === 'production') {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in production')
  }
  if (config.auth0 === null && config.nodeEnv === 'production') {
    throw new Error('AUTH0_DOMAIN and AUTH0_AUDIENCE are required in production')
  }
}
