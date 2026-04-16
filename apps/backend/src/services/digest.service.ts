/**
 * Email digest: select highlights, send via Resend, record job runs.
 */
import { and, desc, eq, isNull, lte, or } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import {
  articles,
  categories,
  digestJobs,
  digestJobRuns,
  newsletterCampaigns,
  emailOutbound,
  readerSubscribers,
  newsletterSubscribers,
} from '../db/schema.js'
import { config } from '../config/env.js'
import type { DigestFrequency } from './reader-subscriber.service.js'
import { computeNextDigestAt } from './reader-subscriber.service.js'
import type {
  CreateNewsletterCampaignBody,
  UpdateNewsletterCampaignBody,
} from '../schemas/digest.js'

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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Aligné sur la charte lecteur Scoop : fond clair, texte foncé, accent rouge, boutons « bulletproof ». */
const EMAIL_THEME = {
  pageBg: '#f4f4f5',
  cardBg: '#ffffff',
  text: '#0d0d0d',
  muted: '#52525b',
  primary: '#e11d48',
  primaryText: '#ffffff',
  border: '#e4e4e7',
  dot: '#ff3131',
} as const

function digestReaderSubject(): string {
  const label = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Paris',
  }).format(new Date())
  return `Scoop Afrique — Votre sélection du ${label}`
}

function buildDigestArticleRowsHtml(articlesList: DigestArticlePick[]): string {
  const base = siteBase()
  return articlesList
    .map((a) => {
      const href = `${base}/articles/${encodeURIComponent(a.slug)}`
      const excerpt = a.excerpt
        ? escapeHtml(a.excerpt.slice(0, 220)) + (a.excerpt.length > 220 ? '…' : '')
        : ''
      const img = a.cover_image_url
        ? `<img src="${escapeHtml(a.cover_image_url)}" alt="" width="296" style="display:block;width:100%;max-width:296px;height:auto;border-radius:12px;border:0;" />`
        : `<div style="min-height:120px;background:${EMAIL_THEME.border};border-radius:12px;"></div>`
      const rubric = a.category_slug ? escapeHtml(a.category_slug) : 'Article'
      return `
<tr>
<td style="padding:20px 0;border-bottom:1px solid ${EMAIL_THEME.border};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td valign="top" class="m-col" style="width:38%;max-width:200px;padding-right:16px;">${img}</td>
<td valign="top" style="width:62%;">
<p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${EMAIL_THEME.muted};">${rubric}</p>
<h2 style="margin:0 0 10px;font-size:18px;line-height:1.25;font-weight:700;color:${EMAIL_THEME.text};font-family:Georgia,'Times New Roman',serif;"><a href="${href}" style="color:${EMAIL_THEME.text};text-decoration:none;">${escapeHtml(a.title)}</a></h2>
${excerpt ? `<p style="margin:0 0 14px;font-size:14px;line-height:1.55;color:${EMAIL_THEME.muted};">${excerpt}</p>` : ''}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:4px;"><tr>
<td style="border-radius:10px;background:${EMAIL_THEME.primary};">
<a href="${href}" style="display:inline-block;padding:14px 22px;font-size:14px;font-weight:600;color:${EMAIL_THEME.primaryText};text-decoration:none;min-height:44px;line-height:1.2;box-sizing:border-box;">Lire l’article →</a>
</td>
</tr></table>
</td>
</tr>
</table>
</td>
</tr>`
    })
    .join('')
}

function wrapScoopNewsletterHtml(params: {
  preheader: string
  title: string
  subtitle: string
  accentNote: string
  articlesHtml: string
  footerHint: string
  unsubUrl: string
  unsubLabel: string
}): string {
  const { preheader, title, subtitle, accentNote, articlesHtml, footerHint, unsubUrl, unsubLabel } =
    params
  const base = siteBase()
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${escapeHtml(title)} — Scoop.Afrique</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_THEME.pageBg};-webkit-text-size-adjust:100%;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:transparent;width:0;height:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_THEME.pageBg};">
<tr>
<td align="center" style="padding:24px 16px;">
<table role="presentation" width="100%" style="max-width:600px;" cellpadding="0" cellspacing="0">
<tr>
<td style="background:${EMAIL_THEME.cardBg};border-radius:16px 16px 0 0;padding:28px 24px 20px;border:1px solid ${EMAIL_THEME.border};border-bottom:0;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="width:12px;height:12px;border-radius:999px;background:${EMAIL_THEME.dot};line-height:0;font-size:0;">&nbsp;</td>
<td style="padding-left:10px;font-size:19px;font-weight:800;letter-spacing:-0.02em;color:${EMAIL_THEME.text};">SCOOP<span style="color:${EMAIL_THEME.primary};">.</span>Afrique</td>
</tr></table>
<p style="margin:18px 0 0;font-size:22px;font-weight:700;line-height:1.2;color:${EMAIL_THEME.text};font-family:Georgia,'Times New Roman',serif;">${escapeHtml(title)}</p>
<p style="margin:10px 0 0;font-size:15px;line-height:1.5;color:${EMAIL_THEME.muted};">${escapeHtml(subtitle)}</p>
<p style="margin:14px 0 0;font-size:13px;line-height:1.55;color:${EMAIL_THEME.muted};border-left:3px solid ${EMAIL_THEME.primary};padding-left:12px;">${escapeHtml(accentNote)}</p>
</td>
</tr>
<tr>
<td style="background:${EMAIL_THEME.cardBg};padding:8px 24px 28px;border:1px solid ${EMAIL_THEME.border};border-top:0;border-radius:0 0 16px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${articlesHtml}</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px;">
<tr>
<td align="center" style="padding:24px 0 8px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="border-radius:10px;border:2px solid ${EMAIL_THEME.primary};">
<a href="${base}/articles" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:${EMAIL_THEME.primary};text-decoration:none;min-height:44px;line-height:1.2;box-sizing:border-box;">Voir tous les articles</a>
</td>
</tr></table>
</td>
</tr>
</table>
<p style="margin:20px 0 0;font-size:12px;line-height:1.55;color:${EMAIL_THEME.muted};text-align:center;">${escapeHtml(footerHint)}</p>
<p style="margin:16px 0 0;font-size:11px;line-height:1.55;color:${EMAIL_THEME.muted};text-align:center;">
<a href="${unsubUrl}" style="color:${EMAIL_THEME.muted};text-decoration:underline;">${escapeHtml(unsubLabel)}</a>
<br /><span style="color:${EMAIL_THEME.border};">·</span>
<a href="${base}" style="color:${EMAIL_THEME.muted};text-decoration:underline;">Scoop.Afrique</a>
</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`
}

function buildDigestPlainText(articlesList: DigestArticlePick[], unsubUrl: string, heading: string): string {
  const base = siteBase()
  const lines: string[] = [heading, '', ...articlesList.flatMap((a) => [`• ${a.title}`, `  ${base}/articles/${a.slug}`, ''])]
  lines.push(unsubLabelLine(unsubUrl))
  return lines.join('\n')
}

function unsubLabelLine(unsubUrl: string): string {
  return `Préférences / désabonnement : ${unsubUrl}`
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

      const slice = toSend.slice(0, 8)
      const html = renderDigestHtml(slice, sub.unsubscribeToken)
      const sendResult = await sendDigestEmail(sub.email, html, sub.unsubscribeToken, slice)

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
  const unsubUrl = `${base}/api/v1/digest/unsubscribe?t=${encodeURIComponent(unsubscribeToken)}`
  const articlesHtml = buildDigestArticleRowsHtml(articlesList)
  const pre =
    articlesList.length > 0
      ? `${articlesList.length} article${articlesList.length > 1 ? 's' : ''} — panafrican news, sélection rédaction`
      : 'Votre sélection Scoop.Afrique'
  return wrapScoopNewsletterHtml({
    preheader: pre,
    title: 'Votre sélection',
    subtitle: 'Décryptages et reportages : l’essentiel de l’actualité africaine.',
    accentNote:
      'Un e-mail pensé pour être lu en quelques secondes : accroche claire, boutons larges, zéro surprise au clic. Ajustez vos centres d’intérêt ou le rythme d’envoi depuis votre compte lecteur.',
    articlesHtml,
    footerHint:
      'Vous recevez ce message car vous suivez Scoop.Afrique avec un compte lecteur. La rédaction respecte votre attention : un seul CTA principal par article, pas de piège à clics.',
    unsubUrl,
    unsubLabel: 'Se désabonner en un clic',
  })
}

async function sendDigestEmail(
  to: string,
  html: string,
  unsubscribeToken: string,
  articlesForPlain?: DigestArticlePick[],
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
  const subject = digestReaderSubject()
  const textBody =
    articlesForPlain && articlesForPlain.length > 0
      ? buildDigestPlainText(articlesForPlain, unsubUrl, subject)
      : `${subject}\n\n${base}/articles\n\n${unsubLabelLine(unsubUrl)}`

  // Keep an explicit runtime response shape to avoid environment-specific `Response`
  // typing conflicts in some build pipelines (e.g. serverless builders).
  const res = (await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resend.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text: textBody,
      headers: {
        'List-Unsubscribe': `<${unsubUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    }),
  })) as unknown as {
    ok: boolean
    status: number
    json: () => Promise<unknown>
  }

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

/** Articles ranked for the weekly mailing (same logic as reader digest picks). */
export async function previewNewsletterWeeklyDigestArticles(limit = 8): Promise<DigestArticlePick[]> {
  return selectDigestArticles(limit)
}

function renderNewsletterWeeklyHtml(articlesList: DigestArticlePick[], listUnsubscribeToken: string): string {
  const base = siteBase()
  const unsubUrl = `${base}/api/v1/newsletter/unsubscribe?token=${encodeURIComponent(listUnsubscribeToken)}`
  const articlesHtml = buildDigestArticleRowsHtml(articlesList)
  const pre =
    articlesList.length > 0
      ? `Cette semaine sur Scoop : ${articlesList[0]?.title ?? 'votre sélection'}`
      : 'Newsletter hebdomadaire Scoop.Afrique'
  return wrapScoopNewsletterHtml({
    preheader: pre,
    title: 'Sélection hebdomadaire',
    subtitle: 'Les temps forts de l’actualité panafricaine, choisis pour vous.',
    accentNote:
      'Merci de votre confiance : un rythme hebdo pour respecter votre boîte mail, des titres clairs, un bouton « Lire l’article » visible sans scroller sur mobile.',
    articlesHtml,
    footerHint:
      'Newsletter Scoop.Afrique — vous pouvez vous désabonner en un clic, sans friction. Les liens mènent toujours au même site sécurisé.',
    unsubUrl,
    unsubLabel: 'Se désabonner de cette newsletter',
  })
}

function weeklyMailingSubject(): string {
  const label = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris',
  }).format(new Date())
  return `Scoop Afrique — La sélection hebdomadaire (${label})`
}

async function sendNewsletterWeeklyListEmail(
  to: string,
  html: string,
  listUnsubscribeToken: string,
  articles: DigestArticlePick[],
): Promise<{ ok: boolean; error?: string; messageId?: string }> {
  if (!config.resend?.apiKey) {
    return { ok: false, error: 'Resend not configured' }
  }
  const from = config.resend.fromEmail
  if (!from) {
    return { ok: false, error: 'RESEND_FROM_EMAIL not set' }
  }

  const base = siteBase()
  const unsubUrl = `${base}/api/v1/newsletter/unsubscribe?token=${encodeURIComponent(listUnsubscribeToken)}`
  const subject = weeklyMailingSubject()
  const textBody =
    articles.length > 0
      ? buildDigestPlainText(articles, unsubUrl, subject)
      : `${subject}\n\n${base}\n\n${unsubLabelLine(unsubUrl)}`

  const res = (await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resend.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text: textBody,
      headers: {
        'List-Unsubscribe': `<${unsubUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    }),
  })) as unknown as {
    ok: boolean
    status: number
    json: () => Promise<unknown>
  }

  const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string }

  if (!res.ok) {
    return { ok: false, error: body.message ?? `Resend HTTP ${res.status}` }
  }

  const messageId = body.id
  if (config.database && messageId) {
    const db = getDb()
    await db.insert(emailOutbound).values({
      kind: 'newsletter_weekly',
      toEmail: to.toLowerCase(),
      resendMessageId: messageId,
      status: 'sent',
      metadata: { list_unsubscribe_token: listUnsubscribeToken },
    })
  }

  return { ok: true, messageId }
}

/**
 * Send the Saturday-style weekly digest to all **confirmed** `newsletter_subscribers` (double opt-in list).
 * Editors trigger this from the back office; picks are auto-ranked (same algorithm as reader digest).
 */
export async function runNewsletterWeeklyDigest(params: {
  dryRun?: boolean
}): Promise<{
  jobId: string
  articleIds: string[]
  recipientsAttempted: number
  recipientsSent: number
  recipientsFailed: number
  error?: string
}> {
  const { dryRun } = params
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

  const db = getDb()
  const picks = await selectDigestArticles(8)

  const [job] = await db
    .insert(digestJobRuns)
    .values({
      frequency: 'weekly',
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
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.status, 'confirmed'))

    for (const sub of subs) {
      recipientsAttempted += 1
      if (dryRun) {
        recipientsSent += 1
        continue
      }

      const html = renderNewsletterWeeklyHtml(picks, sub.listUnsubscribeToken)
      const sendResult = await sendNewsletterWeeklyListEmail(sub.email, html, sub.listUnsubscribeToken, picks)

      if (sendResult.ok) {
        recipientsSent += 1
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

function campaignToApi(row: typeof newsletterCampaigns.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    segment_id: null as string | null,
    frequency: row.cadence,
    status: row.status,
    scheduled_at: row.sendAt?.toISOString() ?? null,
    sent_at: row.lastSentAt?.toISOString() ?? null,
    subject: row.subjectTemplate,
    template_key: null as string | null,
    stats: row.segmentFilter as Record<string, unknown>,
    body_html: row.bodyHtml ?? null,
    preheader: row.preheader ?? null,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  }
}

function jobToApi(row: typeof digestJobs.$inferSelect) {
  return {
    id: row.id,
    campaign_id: row.campaignId,
    frequency: row.frequency,
    status: row.status,
    scheduled_for: row.scheduledFor.toISOString(),
    started_at: row.startedAt?.toISOString() ?? null,
    completed_at: row.completedAt?.toISOString() ?? null,
    result: row.result as Record<string, unknown> | null,
    error: row.error,
    created_at: row.createdAt.toISOString(),
  }
}

export async function listNewsletterCampaigns() {
  if (!config.database) return []
  const db = getDb()
  const rows = await db.select().from(newsletterCampaigns).orderBy(desc(newsletterCampaigns.createdAt))
  return rows.map(campaignToApi)
}

export async function createNewsletterCampaign(body: CreateNewsletterCampaignBody) {
  if (!config.database) throw new Error('Database not configured (DATABASE_URL)')
  const db = getDb()
  const cadence = body.frequency ?? 'weekly'
  const [row] = await db
    .insert(newsletterCampaigns)
    .values({
      name: body.name,
      cadence,
      segmentFilter: body.stats ?? {},
      subjectTemplate: body.subject?.trim() || 'Newsletter',
      bodyHtml: null,
      preheader: null,
      status: body.status ?? 'draft',
      sendAt: body.scheduled_at ? new Date(body.scheduled_at) : null,
      lastSentAt: null,
      createdBy: null,
    })
    .returning()
  return campaignToApi(row!)
}

export async function updateNewsletterCampaign(id: string, body: UpdateNewsletterCampaignBody) {
  if (!config.database) return null
  const db = getDb()
  const patch: {
    updatedAt: Date
    name?: string
    cadence?: 'daily' | 'weekly' | 'monthly'
    status?: (typeof newsletterCampaigns.$inferSelect)['status']
    sendAt?: Date | null
    subjectTemplate?: string
    segmentFilter?: Record<string, unknown>
  } = { updatedAt: new Date() }
  if (body.name !== undefined) patch.name = body.name
  if (body.frequency !== undefined) {
    patch.cadence = body.frequency
  }
  if (body.status !== undefined) patch.status = body.status
  if (body.scheduled_at !== undefined) patch.sendAt = body.scheduled_at ? new Date(body.scheduled_at) : null
  if (body.subject !== undefined) patch.subjectTemplate = body.subject ?? 'Newsletter'
  if (body.stats !== undefined) patch.segmentFilter = body.stats
  const [row] = await db.update(newsletterCampaigns).set(patch).where(eq(newsletterCampaigns.id, id)).returning()
  return row ? campaignToApi(row) : null
}

export async function deleteNewsletterCampaign(id: string) {
  if (!config.database) return false
  const db = getDb()
  const res = await db.delete(newsletterCampaigns).where(eq(newsletterCampaigns.id, id)).returning({ id: newsletterCampaigns.id })
  return res.length > 0
}

export interface EnqueueDigestInput {
  frequency: Exclude<DigestFrequency, 'off'>
  campaign_id?: string
  scheduled_for?: Date
  send_now?: boolean
}

/**
 * Enqueue a digest job. When send_now is true, marks job as sent with a placeholder result (email dispatch is TODO).
 */
export async function enqueueDigestJob(input: EnqueueDigestInput) {
  if (!config.database) throw new Error('Database not configured (DATABASE_URL)')
  const db = getDb()
  const scheduledFor = input.scheduled_for ?? new Date()
  const sendNow = input.send_now === true

  const [row] = await db
    .insert(digestJobs)
    .values({
      campaignId: input.campaign_id ?? null,
      frequency: input.frequency,
      status: sendNow ? 'sent' : 'pending',
      scheduledFor,
      startedAt: sendNow ? new Date() : null,
      completedAt: sendNow ? new Date() : null,
      result: sendNow
        ? { mode: 'immediate', note: 'Digest pipeline not wired; mark as sent for API contract.' }
        : null,
    })
    .returning()

  return jobToApi(row!)
}

export async function listDigestJobs(limit = 50) {
  if (!config.database) return []
  const db = getDb()
  const rows = await db.select().from(digestJobs).orderBy(desc(digestJobs.createdAt)).limit(Math.min(limit, 200))
  return rows.map(jobToApi)
}
