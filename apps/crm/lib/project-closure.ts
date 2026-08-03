/**
 * Domaine d'affichage de la clôture de dossier.
 *
 * Toute la validation vit ici, hors composant React : le formulaire ne fait que
 * la refléter. Le backend revalide de toute façon chaque règle.
 */

export type ClosureType =
  | 'completed'
  | 'client_abandoned'
  | 'mutual_termination'
  | 'company_cancelled'

export type InvoiceResolutionType = 'credit_note' | 'bad_debt'

export const CLOSURE_TYPE_LABELS: Record<ClosureType, string> = {
  completed: 'Projet terminé',
  client_abandoned: 'Abandon du client',
  mutual_termination: 'Rupture d’un commun accord',
  company_cancelled: 'Annulation par Scoop Afrique',
}

export const RESOLUTION_LABELS: Record<InvoiceResolutionType, string> = {
  credit_note: 'Avoir',
  bad_debt: 'Créance abandonnée',
}

export interface ClosurePreviewInvoice {
  id: string
  reference?: string
  remaining: number
  allowed_resolutions: InvoiceResolutionType[]
}

export interface ClosurePreview {
  closure_version: number
  fingerprint: string
  requires_reconciliation: boolean
  open_invoices: ClosurePreviewInvoice[]
  counts: Record<string, number>
}

export interface ClosureResolutionDraft {
  invoiceId: string
  type: InvoiceResolutionType
  amount: number
  reason: string
  externalReference?: string
  evidenceUrl?: string
  managerAttestation?: boolean
}

export interface ClosureDraft {
  closureType: ClosureType | null
  reason: string
  resolutions: ClosureResolutionDraft[]
  /** Référence projet retapée par l'utilisateur à l'étape de confirmation. */
  confirmationReference: string
}

export interface ClosureDraftValidation {
  canSubmit: boolean
  /** Erreurs par champ ; la clé d'une facture est `invoice:<id>`. */
  errors: Record<string, string>
  /** Première étape (1-4) contenant une erreur, ou null. */
  firstInvalidStep: number | null
}

export const MIN_REASON_LENGTH = 10

export function summarizeResolvedAmount(
  resolutions: ClosureResolutionDraft[],
  invoiceId: string,
): number {
  return resolutions
    .filter((resolution) => resolution.invoiceId === invoiceId)
    .reduce((sum, resolution) => sum + (Number.isFinite(resolution.amount) ? resolution.amount : 0), 0)
}

export function validateClosureDraft(
  preview: ClosurePreview,
  draft: ClosureDraft,
  projectReference: string,
): ClosureDraftValidation {
  const errors: Record<string, string> = {}

  if (!draft.closureType) {
    errors.closureType = 'Choisissez un motif de clôture.'
  }
  const reason = draft.reason.trim()
  if (reason.length < MIN_REASON_LENGTH) {
    errors.reason = `Décrivez la clôture en ${MIN_REASON_LENGTH} caractères minimum.`
  }
  if (reason.length > 2000) {
    errors.reason = 'La description ne peut pas dépasser 2000 caractères.'
  }

  for (const invoice of preview.open_invoices) {
    const key = `invoice:${invoice.id}`
    const resolutions = draft.resolutions.filter(
      (resolution) => resolution.invoiceId === invoice.id,
    )
    if (resolutions.length === 0) {
      errors[key] = 'Cette facture ouverte doit être résolue.'
      continue
    }
    if (resolutions.some((resolution) => !Number.isInteger(resolution.amount) || resolution.amount <= 0)) {
      errors[key] = 'Chaque montant doit être un entier positif en FCFA.'
      continue
    }
    const resolved = summarizeResolvedAmount(draft.resolutions, invoice.id)
    if (resolved !== invoice.remaining) {
      errors[key] = `Le total des résolutions doit être exactement ${invoice.remaining} FCFA.`
      continue
    }
    const missingReference = resolutions.some(
      (resolution) => resolution.type === 'credit_note' && !resolution.externalReference?.trim(),
    )
    if (missingReference) {
      errors[key] = 'Un avoir exige sa référence externe.'
      continue
    }
    const missingEvidence = resolutions.some(
      (resolution) =>
        resolution.type === 'bad_debt' &&
        !resolution.evidenceUrl?.trim() &&
        resolution.managerAttestation !== true,
    )
    if (missingEvidence) {
      errors[key] = 'Une créance abandonnée exige une preuve ou l’attestation du responsable.'
      continue
    }
    const notAllowed = resolutions.some(
      (resolution) => !invoice.allowed_resolutions.includes(resolution.type),
    )
    if (notAllowed) {
      errors[key] = 'Ce type de résolution n’est pas autorisé pour cette facture.'
    }
  }

  if (draft.confirmationReference !== projectReference) {
    errors.confirmationReference = 'Saisissez exactement la référence du projet.'
  }

  const stepOfError = (key: string): number => {
    if (key === 'closureType' || key === 'reason') return 2
    if (key.startsWith('invoice:')) return 3
    return 4
  }
  const steps = Object.keys(errors).map(stepOfError)

  return {
    canSubmit: Object.keys(errors).length === 0,
    errors,
    firstInvalidStep: steps.length ? Math.min(...steps) : null,
  }
}

export function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Repli déterministe en format UUID v4 quand `crypto.randomUUID` manque.
  const bytes = new Uint8Array(16)
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Math.floor(Math.random() * 256)
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function toClosurePayload(
  preview: ClosurePreview,
  draft: ClosureDraft,
): Record<string, unknown> {
  return {
    closure_type: draft.closureType,
    reason: draft.reason.trim(),
    closure_version: preview.closure_version,
    preview_fingerprint: preview.fingerprint,
    invoice_resolutions: draft.resolutions.map((resolution) => ({
      invoice_id: resolution.invoiceId,
      type: resolution.type,
      amount: resolution.amount,
      reason: resolution.reason.trim(),
      ...(resolution.externalReference?.trim()
        ? { external_reference: resolution.externalReference.trim() }
        : {}),
      ...(resolution.evidenceUrl?.trim() ? { evidence_url: resolution.evidenceUrl.trim() } : {}),
      ...(resolution.managerAttestation === true ? { manager_attestation: true as const } : {}),
    })),
  }
}

export const CLOSURE_ERROR_MESSAGES: Record<string, string> = {
  PROJECT_ARCHIVED: 'Ce dossier est déjà archivé.',
  PROJECT_ALREADY_CLOSED: 'Ce dossier a déjà été clôturé.',
  PROJECT_NOT_ARCHIVED: 'Ce projet n’est pas une archive à régulariser.',
  CLOSURE_PREVIEW_STALE:
    'Le dossier a changé depuis l’ouverture de l’assistant. Rechargez l’aperçu.',
  INVOICE_RESOLUTION_REQUIRED: 'Chaque facture ouverte doit être résolue.',
  INVOICE_RESOLUTION_MISMATCH: 'Le montant résolu ne correspond pas au solde restant.',
  CREDIT_NOTE_REFERENCE_REQUIRED: 'Un avoir exige sa référence externe.',
  BAD_DEBT_EVIDENCE_REQUIRED: 'Une créance abandonnée exige une preuve ou une attestation.',
  PROJECT_RESTORE_FORBIDDEN:
    'Ce dossier contient un avoir ou une créance abandonnée : il ne peut plus être rouvert.',
  IDEMPOTENCY_CONFLICT: 'Une clôture différente a déjà utilisé cette clé. Rechargez la page.',
  IDEMPOTENCY_KEY_REQUIRED: 'Requête invalide : clé d’idempotence manquante.',
}

export function closureErrorMessage(code: string | undefined, fallback: string): string {
  if (!code) return fallback
  return CLOSURE_ERROR_MESSAGES[code] ?? fallback
}

/**
 * Envoi de la clôture. Un helper dédié plutôt qu'un assouplissement du type
 * générique de `crmPost` : seul cet appel a besoin d'un en-tête d'idempotence.
 */
export async function closeProjectFolder(params: {
  projectId: string
  payload: Record<string, unknown>
  idempotencyKey: string
  reconcile?: boolean
}): Promise<{ data?: Record<string, unknown>; error?: string; code?: string }> {
  const path = params.reconcile ? 'archive-reconciliation' : 'close-and-archive'
  const response = await fetch(`/api/crm/projects/${params.projectId}/${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': params.idempotencyKey,
    },
    body: JSON.stringify(params.payload),
  })
  const json = (await response.json().catch(() => ({}))) as {
    data?: Record<string, unknown>
    error?: string
    message?: string
  }
  if (!response.ok) {
    return {
      code: json.error,
      error: closureErrorMessage(json.error, json.message ?? 'La clôture a échoué.'),
    }
  }
  return { data: json.data }
}
