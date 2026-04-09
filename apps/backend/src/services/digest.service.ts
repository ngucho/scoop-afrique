/**
 * Email digest: select highlights, send via Resend, record job runs.
 */
import { and, desc, eq, isNull, lte, or } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import {
  articles,
  categories,
  digestJobRuns,
  emailOutbound,
  readerSubscribers,
} from '../db/schema.js'
import { config } from '../config/env.js'
import type { DigestFrequency } from './reader-subscriber.service.js'
import { computeNextDigestAt } from './reader-subscriber.service.js'

const EDITORIAL_TAGS = ['à la une', 'editorial', 'edito', 'focus', 'investigation']

export interface DigestArticlePick {
  id: string
  slug: string
  title: string
  excerpt: string | null
  cover_image_url: string | null
  published_at: string | null
  view_count: number
  tags: string[]
  category_slug: string | null
}

function siteBase(): string {
  return config.publicSiteUrl?.replace(/\/+$/, '') ?? 'https://www.scoop-afrique.com'
}

/** Score for ranking: recency + popularity + editorial tag overlap. */
function scoreArticle(
  a: {
    publishedAt: Date | null
    viewCount: number
    tags: string[] | null
  },
  now: number,
): number {
  const pub = a.publishedAt?.getTime() ?? 0
  const ageHours = Math.max(1, (now - pub) / 3600000)
  const recency = 1000 / Math.sqrt(ageHours)
  const pop = Math.log10(10 + (a.viewCount ?? 0))
  const tagBonus =
    (a.tags ?? []).some((t) =>
      EDITORIAL_TAGS.some((e) => t.toLowerCase().includes(e)),
    )
      ? 15
      : 0
  return recency + pop * 3 + tagBonus
}

export async function selectDigestArticles(limit = 8): Promise<DigestArticlePick[]> {
  if (!config.database) return []
  const db = getDb()
  const now = Date.now()
  const rows = await db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      excerpt: articles.excerpt,
      coverImageUrl: articles.coverImageUrl,
      publishedAt: articles.publishedAt,
      viewCount: articles.viewCount,
      tags: articles.tags,
      categorySlug: categories.slug,
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(eq(articles.status, 'published'))
    .orderBy(desc(articles.publishedAt))
    .limit(80)

  const ranked = rows
    .map((r) => ({
      ...r,
      _score: scoreArticle(
        {
          publishedAt: r.publishedAt,
          viewCount: r.viewCount,
          tags: r.tags ?? [],
        },
        now,
      ),
    }))
    .sort((a, b) => b._score - a._score)
    .slice(0, limit)

  return ranked.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    cover_image_url: r.coverImageUrl,
    published_at: r.publishedAt?.toISOString() ?? null,
    view_count: r.viewCount,
    tags: r.tags ?? [],
    category_slug: r.categorySlug,
  }))
}

function filterArticlesForSubscriber(
  picks: DigestArticlePick[],
  categorySlugById: Map<string, string>,
  topicCategoryIds: string[],
): DigestArticlePick[] {
  if (!topicCategoryIds.length) return picks
  const allowed = new Set(
    topicCategoryIds
      .map((id) => categorySlugById.get(id))
      .filter((s): s is string => !!s),
  )
  if (allowed.size === 0) return picks
  return picks.filter((a) => {
    const slug = a.category_slug
    return slug && allowed.has(slug)
  })
}

async function loadCategorySlugMap(): Promise<Map<string, string>> {
  if (!config.database) return new Map()
  const db = getDb()
  const rows = await db.select({ id: categories.id, slug: categories.slug }).from(categories)
  return new Map(rows.map((r) => [r.id, r.slug]))
}

export async function runDigestJob(params: {
  frequency: DigestFrequency
  dryRun?: boolean
}): Promise<{
  jobId: string
  articleIds: string[]
  recipientsAttempted: number
  recipientsSent: number
  recipientsFailed: number
  error?: string
}> {
  const { frequency, dryRun } = params
  if (!config.database) {
    return {
      jobId: '',
      articleIds: [],
      recipientsAttempted: 0,
      recipientsSent: 0,
      recipientsFailed: 0,
      error: 'Database not configured',
    }
  }
  if (frequency === 'off') {
    return {
      jobId: '',
      articleIds: [],
      recipientsAttempted: 0,
      recipientsSent: 0,
      recipientsFailed: 0,
      error: 'Invalid frequency',
    }
  }

  const db = getDb()
  const now = new Date()
  const picks = await selectDigestArticles(12)
  const categorySlugById = await loadCategorySlugMap()

  const [job] = await db
    .insert(digestJobRuns)
    .values({
      frequency,
      articleIds: picks.map((p) => p.id),
    })
    .returning({ id: digestJobRuns.id })

  const jobId = job?.id ?? ''
  let recipientsAttempted = 0
  let recipientsSent = 0
  let recipientsFailed = 0
  let lastError: string | undefined

  try {
    const subs = await db
      .select()
      .from(readerSubscribers)
      .where(
        and(
          eq(readerSubscribers.digestFrequency, frequency),
          isNull(readerSubscribers.unsubscribedAt),
          or(isNull(readerSubscribers.nextDigestAt), lte(readerSubscribers.nextDigestAt, now)),
        ),
      )

    for (const sub of subs) {
      recipientsAttempted += 1
      const topicIds = sub.topicCategoryIds ?? []
      const personal = filterArticlesForSubscriber(picks, categorySlugById, topicIds)
      const toSend =
        personal.length >= 3
          ? personal
          : personal.length > 0
            ? [...personal, ...picks.filter((p) => !personal.some((x) => x.id === p.id))].slice(0, 12)
            : picks

      if (dryRun) {
        recipientsSent += 1
        continue
      }

      const html = renderDigestHtml(toSend.slice(0, 8), sub.unsubscribeToken)
      const sendResult = await sendDigestEmail(sub.email, html, sub.unsubscribeToken)

      if (sendResult.ok) {
        recipientsSent += 1
        const nextAt = computeNextDigestAt(frequency, now)
        await db
          .update(readerSubscribers)
          .set({
            nextDigestAt: nextAt,
            updatedAt: new Date(),
          })
          .where(eq(readerSubscribers.auth0Sub, sub.auth0Sub))
      } else {
        recipientsFailed += 1
        lastError = sendResult.error
      }
    }

    await db
      .update(digestJobRuns)
      .set({
        finishedAt: new Date(),
        recipientsAttempted,
        recipientsSent,
        recipientsFailed,
        error: lastError ?? null,
      })
      .where(eq(digestJobRuns.id, jobId))
  } catch (e) {
    lastError = e instanceof Error ? e.message : String(e)
    await db
      .update(digestJobRuns)
      .set({
        finishedAt: new Date(),
        recipientsAttempted,
        recipientsSent,
        recipientsFailed,
        error: lastError,
      })
      .where(eq(digestJobRuns.id, jobId))
  }

  return {
    jobId,
    articleIds: picks.map((p) => p.id),
    recipientsAttempted,
    recipientsSent,
    recipientsFailed,
    error: lastError,
  }
}

function renderDigestHtml(articlesList: DigestArticlePick[], unsubscribeToken: string): string {
  const base = siteBase()
  const listHtml = articlesList
    .map(
      (a) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #eee;">
          ${a.cover_image_url ? `<img src="${escapeHtml(a.cover_image_url)}" alt="" width="120" style="max-width:120px;border-radius:4px;vertical-align:top;" />` : ''}
          <div style="display:inline-block;max-width:420px;margin-left:12px;vertical-align:top;">
            <a href="${base}/articles/${escapeHtml(a.slug)}" style="color:#111;font-weight:600;text-decoration:none;font-size:16px;">${escapeHtml(a.title)}</a>
            ${a.excerpt ? `<p style="margin:6px 0 0;color:#444;font-size:14px;">${escapeHtml(a.excerpt.slice(0, 200))}${a.excerpt.length > 200 ? '…' : ''}</p>` : ''}
          </div>
        </td>
      </tr>`,
    )
    .join('')

  const unsubUrl = `${base}/api/v1/digest/unsubscribe?t=${encodeURIComponent(unsubscribeToken)}`

  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
  <h1 style="font-size:20px;">Scoop Afrique — Sélection</h1>
  <table width="100%" cellpadding="0" cellspacing="0">${listHtml}</table>
  <p style="margin-top:24px;font-size:12px;color:#666;">
    <a href="${unsubUrl}">Se désabonner en un clic</a> · Scoop Afrique
  </p>
  </body></html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function sendDigestEmail(
  to: string,
  html: string,
  unsubscribeToken: string,
): Promise<{ ok: boolean; error?: string; messageId?: string }> {
  if (!config.resend?.apiKey) {
    return { ok: false, error: 'Resend not configured' }
  }
  const from = config.resend.fromEmail
  if (!from) {
    return { ok: false, error: 'RESEND_FROM_EMAIL not set' }
  }

  const base = siteBase()
  const unsubUrl = `${base}/api/v1/digest/unsubscribe?t=${encodeURIComponent(unsubscribeToken)}`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resend.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'Scoop Afrique — Votre sélection',
      html,
      headers: {
        'List-Unsubscribe': `<${unsubUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    }),
  })

  const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string }

  if (!res.ok) {
    return { ok: false, error: body.message ?? `Resend HTTP ${res.status}` }
  }

  const messageId = body.id
  if (config.database && messageId) {
    const db = getDb()
    await db.insert(emailOutbound).values({
      kind: 'digest',
      toEmail: to.toLowerCase(),
      resendMessageId: messageId,
      status: 'sent',
      metadata: { unsubscribe_token: unsubscribeToken },
    })
  }

  return { ok: true, messageId }
}

export async function updateEmailStatusFromWebhook(
  resendMessageId: string,
  eventType: string,
): Promise<void> {
  if (!config.database) return
  const db = getDb()

  let status: (typeof emailOutbound.$inferSelect)['status'] = 'sent'
  if (eventType === 'email.delivered') status = 'delivered'
  else if (eventType === 'email.bounced') status = 'bounced'
  else if (eventType === 'email.complained') status = 'complained'
  else if (eventType === 'email.failed') status = 'failed'

  await db
    .update(emailOutbound)
    .set({ status, updatedAt: new Date() })
    .where(eq(emailOutbound.resendMessageId, resendMessageId))
}
