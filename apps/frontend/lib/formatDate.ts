/**
 * Date formatting utility for Scoop Afrique.
 * All dates display in Africa/Abidjan timezone (UTC).
 * Format: "25 janvier 1999 à 11:00 UTC"
 */

const FULL_FORMAT: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Africa/Abidjan',
  timeZoneName: 'short',
}

const SHORT_FORMAT: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Africa/Abidjan',
}

const RELATIVE_THRESHOLDS = [
  { limit: 60, unit: 'seconds' as const, divisor: 1 },
  { limit: 3600, unit: 'minutes' as const, divisor: 60 },
  { limit: 86400, unit: 'hours' as const, divisor: 3600 },
  { limit: 604800, unit: 'days' as const, divisor: 86400 },
]

/**
 * Format a date string for display.
 * Output: "25 janvier 1999 à 11:00 UTC"
 */
export function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '—'
  try {
    return new Intl.DateTimeFormat('fr-FR', FULL_FORMAT).format(new Date(isoDate))
  } catch {
    return '—'
  }
}

/**
 * Format a date string in short form (no time).
 * Output: "25 janvier 1999"
 */
export function formatDateShort(isoDate: string | null | undefined): string {
  if (!isoDate) return '—'
  try {
    return new Intl.DateTimeFormat('fr-FR', SHORT_FORMAT).format(new Date(isoDate))
  } catch {
    return '—'
  }
}

/**
 * Format a date as relative time if recent, otherwise full date.
 * "il y a 5 minutes" / "il y a 2 heures" / full date if > 7 days
 */
export function formatDateRelative(isoDate: string | null | undefined): string {
  if (!isoDate) return '—'
  try {
    const date = new Date(isoDate)
    const diffS = Math.floor((Date.now() - date.getTime()) / 1000)
    if (diffS < 0) return formatDate(isoDate)

    for (const { limit, unit, divisor } of RELATIVE_THRESHOLDS) {
      if (diffS < limit) {
        const value = Math.floor(diffS / divisor)
        const labels: Record<string, string> = {
          seconds: value <= 1 ? 'seconde' : 'secondes',
          minutes: value <= 1 ? 'minute' : 'minutes',
          hours: value <= 1 ? 'heure' : 'heures',
          days: value <= 1 ? 'jour' : 'jours',
        }
        return `il y a ${value} ${labels[unit]}`
      }
    }

    return formatDate(isoDate)
  } catch {
    return '—'
  }
}
