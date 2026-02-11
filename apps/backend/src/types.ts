/**
 * Shared Hono environment types for the backend.
 */
import type { AuthUser } from './lib/auth.js'

/** Hono environment with typed context variables. */
export type AppEnv = {
  Variables: {
    user: AuthUser
  }
}
