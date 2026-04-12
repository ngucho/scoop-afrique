/**
 * Authenticated reader (subscriber) account — Auth0 reader SPA token only.
 */
import { Hono } from 'hono'
import { requireReaderAuth } from '../middleware/reader-auth.js'
import { updateReaderAccountBodySchema } from '../schemas/reader.js'
import * as readerSubscriberService from '../services/reader-subscriber.service.js'
import * as readerProfileService from '../services/reader-profile.service.js'
import { getOrCreateProfile } from '../services/profile.service.js'
import * as tribuneFollow from '../services/tribune-follow.service.js'
import * as contributionService from '../services/contribution.service.js'

const app = new Hono()

app.use('*', requireReaderAuth)

app.get('/me', async (c) => {
  const reader = c.get('reader' as never) as { sub: string; email: string }
  const row = await readerSubscriberService.getOrCreateReaderSubscriber(reader.sub, reader.email)
  const [profile, scoopProfile] = await Promise.all([
    readerProfileService.getReaderPublicProfile(reader.sub),
    getOrCreateProfile({ sub: reader.sub, email: reader.email, role: 'journalist' }),
  ])
  return c.json({
    data: {
      ...row,
      profile,
      profile_id: scoopProfile.id,
    },
  })
})

app.patch('/me', async (c) => {
  const reader = c.get('reader' as never) as { sub: string; email: string }
  await readerSubscriberService.getOrCreateReaderSubscriber(reader.sub, reader.email)

  const parsed = updateReaderAccountBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400)
  }

  const {
    topic_category_ids,
    digest_frequency,
    sync_auth0,
    interest_category_ids,
    display_name,
    pseudo,
    avatar_url,
    date_of_birth,
    address_line1,
    address_line2,
    city,
    postal_code,
    country_code,
    bio,
  } = parsed.data

  const updated = await readerSubscriberService.updateReaderSubscriber(reader.sub, {
    topicCategoryIds: topic_category_ids,
    digestFrequency: digest_frequency,
  })
  if (!updated) {
    return c.json({ error: 'Not found' }, 404)
  }

  const hasProfilePatch =
    display_name !== undefined ||
    pseudo !== undefined ||
    avatar_url !== undefined ||
    date_of_birth !== undefined ||
    address_line1 !== undefined ||
    address_line2 !== undefined ||
    city !== undefined ||
    postal_code !== undefined ||
    country_code !== undefined ||
    bio !== undefined ||
    interest_category_ids !== undefined

  let profile: readerProfileService.ReaderPublicProfileDto | null =
    (await readerProfileService.getReaderPublicProfile(reader.sub)) ?? null

  if (hasProfilePatch) {
    try {
      profile = await readerProfileService.upsertReaderPublicProfile(
        reader.sub,
        {
          display_name,
          pseudo,
          avatar_url,
          date_of_birth,
          address_line1,
          address_line2,
          city,
          postal_code,
          country_code,
          bio,
          interest_category_ids,
        },
        { syncAuth0: sync_auth0 !== false },
      )
    } catch (e) {
      const err = e as Error & { code?: string }
      if (err.code === 'PSEUDO_TAKEN') {
        return c.json({ error: 'Pseudo déjà utilisé', code: 'PSEUDO_TAKEN' }, 409)
      }
      throw e
    }
  }

  return c.json({ data: { ...updated, profile } })
})

/** Profil staff/lecteur UUID + réseau Tribune (suivis / abonnés). */
app.get('/me/tribune/context', async (c) => {
  const reader = c.get('reader' as never) as { sub: string; email: string }
  const profile = await getOrCreateProfile({
    sub: reader.sub,
    email: reader.email,
    role: 'journalist',
  })
  const [followers, following] = await Promise.all([
    tribuneFollow.listFollowersOf(profile.id, 200),
    tribuneFollow.listFollowingBy(profile.id, 200),
  ])
  return c.json({
    data: {
      profile_id: profile.id,
      followers,
      following,
    },
  })
})

/** Mes notes (mur Tribune). */
app.get('/me/contributions', async (c) => {
  const reader = c.get('reader' as never) as { sub: string; email: string }
  const profile = await getOrCreateProfile({
    sub: reader.sub,
    email: reader.email,
    role: 'journalist',
  })
  const cursor = c.req.query('cursor')?.trim() || undefined
  const limit = Math.min(Number(c.req.query('limit')) || 24, 100)
  const { data, next_cursor } = await contributionService.listPublicContributionsCursor({
    author_profile_id: profile.id,
    cursor: cursor ?? null,
    limit,
    sort: 'latest',
  })
  return c.json({ data, next_cursor })
})

export default app
