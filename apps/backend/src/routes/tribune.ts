/**
 * Tribune public profiles, follow graph, network lists.
 */
import { Hono } from 'hono'
import { optionalContributorAuth, requireContributorAuth } from '../middleware/contributor-auth.js'
import * as tribuneProfile from '../services/tribune-profile.service.js'
import * as tribuneFollow from '../services/tribune-follow.service.js'
import * as contributionService from '../services/contribution.service.js'
import type { AppEnv } from '../types.js'

const app = new Hono<AppEnv>()

app.get('/users/:pseudo', optionalContributorAuth, async (c) => {
  const pseudo = c.req.param('pseudo')
  const profile = await tribuneProfile.getTribuneProfileByPseudo(pseudo)
  if (!profile) return c.json({ error: 'Not found' }, 404)

  const [followers, following, feed] = await Promise.all([
    tribuneFollow.countFollowers(profile.profile_id),
    tribuneFollow.countFollowing(profile.profile_id),
    contributionService.listPublicContributionsCursor({
      limit: 24,
      sort: 'latest',
      author_profile_id: profile.profile_id,
    }),
  ])

  let is_followed_by_me: boolean | undefined
  const viewer = c.get('contributor' as never) as { profileId: string } | undefined
  if (viewer && viewer.profileId !== profile.profile_id) {
    is_followed_by_me = await tribuneFollow.isFollowing(viewer.profileId, profile.profile_id)
  }

  return c.json({
    data: {
      profile: {
        profile_id: profile.profile_id,
        pseudo: profile.pseudo,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
      },
      counts: { followers, following },
      is_followed_by_me,
      contributions: feed.data,
      next_cursor: feed.next_cursor,
    },
  })
})

app.get('/users/:pseudo/followers', async (c) => {
  const pseudo = c.req.param('pseudo')
  const p = await tribuneProfile.getTribuneProfileByPseudo(pseudo)
  if (!p) return c.json({ error: 'Not found' }, 404)
  const data = await tribuneFollow.listFollowersOf(p.profile_id)
  return c.json({ data })
})

app.get('/users/:pseudo/following', async (c) => {
  const pseudo = c.req.param('pseudo')
  const p = await tribuneProfile.getTribuneProfileByPseudo(pseudo)
  if (!p) return c.json({ error: 'Not found' }, 404)
  const data = await tribuneFollow.listFollowingBy(p.profile_id)
  return c.json({ data })
})

app.post('/follow/:profileId', requireContributorAuth, async (c) => {
  const followingId = c.req.param('profileId')
  const viewer = c.get('contributor' as never) as { profileId: string }
  const ok = await tribuneFollow.followProfile(viewer.profileId, followingId)
  if (!ok) return c.json({ error: 'Could not follow' }, 400)
  return c.json({ ok: true })
})

app.delete('/follow/:profileId', requireContributorAuth, async (c) => {
  const followingId = c.req.param('profileId')
  const viewer = c.get('contributor' as never) as { profileId: string }
  const ok = await tribuneFollow.unfollowProfile(viewer.profileId, followingId)
  return c.json({ ok })
})

export default app
