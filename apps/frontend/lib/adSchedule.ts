/** Indique si une campagne « active » est réellement éligible côté API public (fenêtre start/end). */
export function adCampaignVisibleOnSite(
  status: string,
  startAtIso: string | null,
  endAtIso: string | null,
  nowMs: number = Date.now(),
): boolean {
  if (status !== 'active') return false
  if (startAtIso) {
    const t = new Date(startAtIso).getTime()
    if (!Number.isNaN(t) && t > nowMs) return false
  }
  if (endAtIso) {
    const t = new Date(endAtIso).getTime()
    if (!Number.isNaN(t) && t < nowMs) return false
  }
  return true
}

export function adScheduleHintFr(
  status: string,
  startAtIso: string | null,
  endAtIso: string | null,
  nowMs: number = Date.now(),
): string {
  if (status !== 'active') {
    return 'Le statut n’est pas « Actif » : la campagne ne sera pas diffusée sur le site reader.'
  }
  if (startAtIso) {
    const t = new Date(startAtIso).getTime()
    if (!Number.isNaN(t) && t > nowMs) {
      return `Programmée : diffusion à partir du ${new Date(startAtIso).toLocaleString('fr-FR')} (heure locale).`
    }
  }
  if (endAtIso) {
    const t = new Date(endAtIso).getTime()
    if (!Number.isNaN(t) && t < nowMs) {
      return `Expirée le ${new Date(endAtIso).toLocaleString('fr-FR')} : plus affichée sur le site (pensez à passer le statut en « Terminé »).`
    }
  }
  if (endAtIso) {
    return `En ligne jusqu’au ${new Date(endAtIso).toLocaleString('fr-FR')} (fin de diffusion).`
  }
  return 'En ligne sans date de fin : diffusion jusqu’à désactivation manuelle.'
}

export function assertAdDateOrder(startAt: string, endAt: string): string | null {
  if (!startAt || !endAt) return null
  const a = new Date(startAt).getTime()
  const b = new Date(endAt).getTime()
  if (Number.isNaN(a) || Number.isNaN(b)) return null
  if (b < a) return 'La date de fin doit être postérieure à la date de début.'
  return null
}
