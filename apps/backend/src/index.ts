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
import contributionsRoutes from './routes/contributions.js'
import adminContributionsRoutes from './routes/admin/contributions.js'
import newsletterRoutes from './routes/newsletter.js'
import readerRoutes from './routes/reader.js'
import digestRoutes from './routes/digest.js'
import announcementsRoutes from './routes/announcements.js'
import adsRoutes from './routes/ads.js'
import homepagePublicRoutes from './routes/homepage.js'
import devisRoutes from './routes/devis.js'
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
import adminAnnouncementsRoutes from './routes/admin/announcements.js'
import adminAdsRoutes from './routes/admin/ads.js'
import adminSubscribersRoutes from './routes/admin/subscribers.js'
import adminDigestRoutes from './routes/admin/digest.js'
import adminReaderPlatformRoutes from './routes/admin/reader-platform.js'
import publicAudienceRoutes from './routes/public-audience.js'
import tribuneRoutes from './routes/tribune.js'
import crmRoutes from './routes/crm/index.js'
import chromePublicRoutes from './routes/chrome-public.js'
import writerArticlesRoutes from './routes/writer-articles.js'
import adminWriterApiKeysRoutes from './routes/admin/writer-api-keys.js'
import sitemapPublicRoutes from './routes/sitemap.js'

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
app.route(`${prefix}/reader`, readerRoutes)
app.route(`${prefix}/digest`, digestRoutes)
app.route(`${prefix}/announcements`, announcementsRoutes)
app.route(`${prefix}/chrome`, chromePublicRoutes)
app.route(`${prefix}/ads`, adsRoutes)
app.route(`${prefix}/homepage`, homepagePublicRoutes)
app.route(`${prefix}/devis`, devisRoutes)

// Comment routes use nested paths
app.route(`${prefix}`, commentsRoutes) // /api/v1/articles/:id/comments + /api/v1/comments/:id
app.route(`${prefix}/contributions`, contributionsRoutes)
app.route(`${prefix}/public/audience`, publicAudienceRoutes)
app.route(`${prefix}/tribune`, tribuneRoutes)
app.route(`${prefix}/writer`, writerArticlesRoutes)
app.route(`${prefix}/sitemap`, sitemapPublicRoutes)

/* ---- Admin API v1 ---- */
app.route(`${prefix}/admin/articles`, adminArticlesRoutes)
app.route(`${prefix}/admin/comments`, adminCommentsRoutes)
app.route(`${prefix}/admin/contributions`, adminContributionsRoutes)
app.route(`${prefix}/admin/categories`, adminCategoriesRoutes)
app.route(`${prefix}/admin/media`, adminMediaRoutes)
app.route(`${prefix}/admin/profile`, adminProfileRoutes)
app.route(`${prefix}/admin/writer-api-keys`, adminWriterApiKeysRoutes)
app.route(`${prefix}/admin/auth0-users`, adminAuth0UsersRoutes)
app.route(`${prefix}/admin/notifications`, adminNotificationsRoutes)
app.route(`${prefix}/admin/announcements`, adminAnnouncementsRoutes)
app.route(`${prefix}/admin/ads`, adminAdsRoutes)
app.route(`${prefix}/admin/subscribers`, adminSubscribersRoutes)
app.route(`${prefix}/admin/digest`, adminDigestRoutes)
app.route(`${prefix}/admin/reader`, adminReaderPlatformRoutes)

// Nested article sub-resources (locks, revisions, collaborators, editorial-comments)
// Routes handle /:articleId/lock, /:articleId/revisions, etc.
app.route(`${prefix}/admin/articles`, adminLocksRoutes)
app.route(`${prefix}/admin/articles`, adminRevisionsRoutes)
app.route(`${prefix}/admin/articles`, adminCollaboratorsRoutes)
app.route(`${prefix}/admin/articles`, adminEditorialCommentsRoutes)

/* ---- CRM API v1 ---- */
app.route(`${prefix}/crm`, crmRoutes)

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
    console.log(`Database: ${config.database ? 'Drizzle configured' : 'NOT CONFIGURED'}`)
  })
}
