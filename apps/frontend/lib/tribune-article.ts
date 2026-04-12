/** Extract article slug from a pasted site URL (e.g. /articles/mon-titre). */
export function extractSlugFromArticleUrl(input: string): string | null {
  const t = input.trim()
  if (!t) return null
  try {
    const u = new URL(t.includes('://') ? t : `https://${t}`)
    const parts = u.pathname.split('/').filter(Boolean)
    const last = parts[parts.length - 1]
    if (last && /^[a-z0-9-]+$/i.test(last)) return last
    return null
  } catch {
    return null
  }
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function looksLikeArticleId(input: string): boolean {
  return UUID_RE.test(input.trim())
}
