/**
 * Plages de dates CRM — même règles que le tableau de bord (URL `from` / `to`, défaut mois civil en cours).
 */

export const CRM_YMD_RE = /^\d{4}-\d{2}-\d{2}$/

export function rawCrmDateParam(
  sp: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const v = sp[key]
  const s = Array.isArray(v) ? v[0] : v
  if (!s || !CRM_YMD_RE.test(s)) return undefined
  return s
}

/**
 * Résout `from` / `to` depuis l’URL avec défaut identique au dashboard : du 1er jour du mois à aujourd’hui.
 */
export function resolveCrmDateRangeFromSearchParams(
  sp: Record<string, string | string[] | undefined>,
): { from: string; to: string } {
  let from = rawCrmDateParam(sp, 'from')
  let to = rawCrmDateParam(sp, 'to')
  const end = new Date()
  const defaultTo = end.toISOString().slice(0, 10)
  const defaultFrom = new Date(end.getFullYear(), end.getMonth(), 1).toISOString().slice(0, 10)
  if (!from) from = defaultFrom
  if (!to) to = defaultTo
  if (from > to) {
    const x = from
    from = to
    to = x
  }
  return { from, to }
}
