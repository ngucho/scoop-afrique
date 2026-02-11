/**
 * Scoop Afrique — Backend API
 *
 * Framework:  Hono + Node.js
 * Database:   Supabase (PostgreSQL)
 * IAM:        Auth0 (sole identity provider)
 * Storage:    Supabase Storage (images only)
 * Videos:     YouTube embed URLs (no upload)
 */
import 'dotenv/config'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { corsMiddleware } from './middleware/cors.js'
import { securityHeaders } from './middleware/security.js'
import { requestLog } from './middleware/requestLog.js'
import { logger } from './lib/logger.js'
import { config, assertConfig } from './config/env.js'

// Routes
import healthRoutes from './routes/health.js'
import articlesRoutes from './routes/articles.js'
import categoriesRoutes from './routes/categories.js'
import commentsRoutes from './routes/comments.js'
import newsletterRoutes from './routes/newsletter.js'
import adminArticlesRoutes from './routes/admin/articles.js'
import adminCommentsRoutes from './routes/admin/comments.js'
import adminCategoriesRoutes from './routes/admin/categories.js'
import adminMediaRoutes from './routes/admin/media.js'
import adminProfileRoutes from './routes/admin/profile.js'
import adminLocksRoutes from './routes/admin/locks.js'
import adminRevisionsRoutes from './routes/admin/revisions.js'
import adminCollaboratorsRoutes from './routes/admin/collaborators.js'
import adminEditorialCommentsRoutes from './routes/admin/editorial-comments.js'
import adminAuth0UsersRoutes from './routes/admin/auth0-users.js'
import adminNotificationsRoutes from './routes/admin/notifications.js'

assertConfig()

const app = new Hono()

/* ---- Global middleware ---- */
app.use('*', requestLog)
app.use('*', securityHeaders)
app.use('*', corsMiddleware)

/* ---- Health (no prefix) ---- */
app.route('/', healthRoutes)

/* ---- Public API v1 ---- */
const prefix = config.apiPrefix // /api/v1
app.route(`${prefix}/articles`, articlesRoutes)
app.route(`${prefix}/categories`, categoriesRoutes)
app.route(`${prefix}/newsletter`, newsletterRoutes)

// Comment routes use nested paths
app.route(`${prefix}`, commentsRoutes) // /api/v1/articles/:id/comments + /api/v1/comments/:id

/* ---- Admin API v1 ---- */
app.route(`${prefix}/admin/articles`, adminArticlesRoutes)
app.route(`${prefix}/admin/comments`, adminCommentsRoutes)
app.route(`${prefix}/admin/categories`, adminCategoriesRoutes)
app.route(`${prefix}/admin/media`, adminMediaRoutes)
app.route(`${prefix}/admin/profile`, adminProfileRoutes)
app.route(`${prefix}/admin/auth0-users`, adminAuth0UsersRoutes)
app.route(`${prefix}/admin/notifications`, adminNotificationsRoutes)

// Nested article sub-resources (locks, revisions, collaborators, editorial-comments)
// Routes handle /:articleId/lock, /:articleId/revisions, etc.
app.route(`${prefix}/admin/articles`, adminLocksRoutes)
app.route(`${prefix}/admin/articles`, adminRevisionsRoutes)
app.route(`${prefix}/admin/articles`, adminCollaboratorsRoutes)
app.route(`${prefix}/admin/articles`, adminEditorialCommentsRoutes)

/* ---- 404 ---- */
app.notFound((c) => c.json({ error: 'Not Found' }, 404))

/* ---- Global error handler ---- */
app.onError((err, c) => {
  const isDev = config.nodeEnv === 'development'
  logger.error(`${c.req.method} ${c.req.path}`, err)
  return c.json(
    {
      error: 'Internal Server Error',
      ...(isDev && { message: err.message }),
    },
    500,
  )
})

/* ---- Export for Vercel (default export = Hono app) ---- */
export default app

/* ---- Start Node server only when not on Vercel ---- */
if (typeof process.env.VERCEL === 'undefined') {
  serve({ fetch: app.fetch, port: config.port }, (info) => {
    console.log(`Backend API running on http://localhost:${info.port} [${config.nodeEnv}]`)
    console.log(`Auth0: ${config.auth0 ? `configured (${config.auth0.domain})` : 'NOT CONFIGURED'}`)
    console.log(`Supabase: ${config.supabase ? 'configured' : 'NOT CONFIGURED'}`)
  })
}
