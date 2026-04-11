/**
 * Normalize user-provided full-text search strings for public article listing.
 * Prevents LIKE wildcard abuse (% _) and caps length for predictable DB load.
 */
export function normalizePublicSearchQuery(raw: string | undefined): string | undefined {
  if (raw == null) return undefined
  const trimmed = raw.trim().replace(/\0/g, '')
  if (!trimmed) return undefined
  const stripped = trimmed.replace(/[%_\\]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!stripped) return undefined
  return stripped.slice(0, 120)
}
