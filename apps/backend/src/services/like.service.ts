import { getSupabase } from '../lib/supabase.js'
import { config } from '../config/env.js'

export async function getLikeCount(articleId: string): Promise<number> {
  if (!config.supabase) return 0
  const supabase = getSupabase()
  const { count, error } = await supabase.from('article_likes').select('*', { count: 'exact', head: true }).eq('article_id', articleId)
  if (error) return 0
  return count ?? 0
}

export async function hasLiked(articleId: string, userId: string | null, anonymousId: string | null): Promise<boolean> {
  if (!config.supabase) return false
  const supabase = getSupabase()
  let query = supabase.from('article_likes').select('id').eq('article_id', articleId).limit(1)
  if (userId) query = query.eq('user_id', userId)
  else if (anonymousId) query = query.eq('anonymous_id', anonymousId)
  else return false
  const { data } = await query
  return (data?.length ?? 0) > 0
}

export async function toggleLike(
  articleId: string,
  userId: string | null,
  anonymousId: string | null
): Promise<{ count: number; liked: boolean }> {
  if (!config.supabase) return { count: 0, liked: false }
  if (!userId && !anonymousId) return { count: await getLikeCount(articleId), liked: false }
  const supabase = getSupabase()
  const existing = await hasLiked(articleId, userId, anonymousId)
  if (existing) {
    let del = supabase.from('article_likes').delete().eq('article_id', articleId)
    if (userId) del = del.eq('user_id', userId)
    else del = del.eq('anonymous_id', anonymousId!)
    await del
  } else {
    await supabase.from('article_likes').insert({
      article_id: articleId,
      user_id: userId ?? null,
      anonymous_id: anonymousId ?? null,
    })
  }
  const count = await getLikeCount(articleId)
  return { count, liked: !existing }
}
