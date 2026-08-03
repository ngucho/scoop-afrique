'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from 'scoop'
import { useCrmCapabilities } from '@/components/auth/CrmCapabilitiesProvider'
import {
  CLOSURE_TYPE_LABELS,
  RESOLUTION_LABELS,
  closeProjectFolder,
  closureErrorMessage,
  newIdempotencyKey,
  summarizeResolvedAmount,
  toClosurePayload,
  validateClosureDraft,
  type ClosureDraft,
  type ClosurePreview,
  type ClosureResolutionDraft,
  type ClosureType,
  type InvoiceResolutionType,
} from '@/lib/project-closure'

const STEP_TITLES = [
  'Impact de la clôture',
  'Motif et description',
  'Résolution des factures ouvertes',
  'Confirmation',
] as const

const COUNT_LABELS: Record<string, string> = {
  devis: 'Devis',
  invoices: 'Factures',
  contracts: 'Contrats',
  tasks: 'Tâches',
  reminders: 'Relances',
  payments: 'Paiements',
  receipts: 'Reçus',
  expenses: 'Dépenses',
  treasuryMovements: 'Mouvements de trésorerie',
}

const fcfa = (amount: number) => `${amount.toLocaleString('fr-FR')} FCFA`

function emptyResolution(
  invoiceId: string,
  type: InvoiceResolutionType,
  amount: number,
): ClosureResolutionDraft {
  return { invoiceId, type, amount, reason: '' }
}

export function ProjectClosureWizard({
  projectId,
  projectReference,
  reconcile = false,
  triggerLabel = 'Clore et archiver le dossier',
}: {
  projectId: string
  projectReference: string
  /** Régularisation d'une archive héritée plutôt que clôture d'un projet actif. */
  reconcile?: boolean
  triggerLabel?: string
}) {
  const router = useRouter()
  const { canManage } = useCrmCapabilities()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [preview, setPreview] = useState<ClosurePreview | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [idempotencyKey, setIdempotencyKey] = useState<string>('')
  const [draft, setDraft] = useState<ClosureDraft>({
    closureType: null,
    reason: '',
    resolutions: [],
    confirmationReference: '',
  })
  const firstInvalidRef = useRef<HTMLElement | null>(null)

  // L'effet ne fait que déclencher le chargement : l'état initial est posé par
  // `openWizard()`, jamais synchronement dans le corps de l'effet.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    fetch(`/api/crm/projects/${projectId}/closure-preview`, { credentials: 'include' })
      .then(async (response) => {
        const json = (await response.json().catch(() => ({}))) as {
          data?: ClosurePreview
          error?: string
          message?: string
        }
        if (cancelled) return
        if (!response.ok || !json.data) {
          setLoadError(closureErrorMessage(json.error, json.message ?? 'Aperçu indisponible.'))
          return
        }
        setPreview(json.data)
        setDraft((current) => ({
          ...current,
          resolutions: json.data!.open_invoices.map((invoice) =>
            emptyResolution(invoice.id, 'bad_debt', invoice.remaining),
          ),
        }))
      })
      .catch(() => {
        if (!cancelled) setLoadError('Aperçu indisponible.')
      })
    return () => {
      cancelled = true
    }
  }, [open, projectId])

  useEffect(() => {
    if (showErrors) firstInvalidRef.current?.focus()
  }, [showErrors, step])

  if (!canManage) return null

  const validation = preview
    ? validateClosureDraft(preview, draft, projectReference)
    : { canSubmit: false, errors: {}, firstInvalidStep: null }
  const errorFor = (key: string) => (showErrors ? validation.errors[key] : undefined)

  /** Un assistant rouvert repart d'un aperçu et d'une clé d'idempotence neufs. */
  function openWizard() {
    setLoadError(null)
    setPreview(null)
    setStep(1)
    setShowErrors(false)
    setDraft({ closureType: null, reason: '', resolutions: [], confirmationReference: '' })
    setIdempotencyKey(newIdempotencyKey())
    setOpen(true)
  }

  function close() {
    setOpen(false)
    setStep(1)
    setShowErrors(false)
    setIdempotencyKey('')
    setDraft({ closureType: null, reason: '', resolutions: [], confirmationReference: '' })
  }

  function updateResolution(index: number, patch: Partial<ClosureResolutionDraft>) {
    setDraft((current) => ({
      ...current,
      resolutions: current.resolutions.map((resolution, position) =>
        position === index ? { ...resolution, ...patch } : resolution,
      ),
    }))
  }

  function addResolution(invoiceId: string) {
    setDraft((current) => ({
      ...current,
      resolutions: [...current.resolutions, emptyResolution(invoiceId, 'credit_note', 0)],
    }))
  }

  function removeResolution(index: number) {
    setDraft((current) => ({
      ...current,
      resolutions: current.resolutions.filter((_, position) => position !== index),
    }))
  }

  function goNext() {
    if (!preview) return
    // Chaque étape valide sa propre portée avant de laisser avancer.
    const blocking = validation.firstInvalidStep
    if (blocking !== null && blocking <= step) {
      setShowErrors(true)
      return
    }
    setShowErrors(false)
    setStep((current) => Math.min(4, current + 1))
  }

  async function submit() {
    if (!preview) return
    if (!validation.canSubmit) {
      setShowErrors(true)
      if (validation.firstInvalidStep) setStep(validation.firstInvalidStep)
      return
    }
    setSubmitting(true)
    const result = await closeProjectFolder({
      projectId,
      payload: toClosurePayload(preview, draft),
      idempotencyKey,
      reconcile,
    })
    setSubmitting(false)
    if (result.error) {
      toast.error(result.error)
      // L'aperçu périmé impose de repartir d'un état frais.
      if (result.code === 'CLOSURE_PREVIEW_STALE') openWizard()
      return
    }
    toast.success(reconcile ? 'Archive régularisée.' : 'Dossier clôturé et archivé.')
    close()
    router.refresh()
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={openWizard}>
        {triggerLabel}
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="closure-wizard-title"
        className="crm-card my-8 w-full max-w-2xl space-y-5 p-6"
      >
        <header className="space-y-1">
          <p className="text-xs text-muted-foreground">
            Étape {step} sur 4 — {STEP_TITLES[step - 1]}
          </p>
          <h2 id="closure-wizard-title" className="text-lg font-semibold">
            {reconcile ? 'Régulariser l’archive' : 'Clore et archiver le dossier'} {projectReference}
          </h2>
        </header>

        <p aria-live="polite" className="text-sm text-destructive">
          {loadError ??
            (showErrors && Object.keys(validation.errors).length > 0
              ? 'Corrigez les champs signalés pour continuer.'
              : '')}
        </p>

        {!preview && !loadError ? (
          <p className="text-sm text-muted-foreground">Chargement de l’aperçu…</p>
        ) : null}

        {preview ? (
          <div className="space-y-4">
            {step === 1 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  La clôture fige le dossier : plus aucune modification ne sera possible.
                  Les paiements, reçus, dépenses et mouvements de trésorerie sont conservés
                  intégralement.
                </p>
                <ul className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(preview.counts).map(([key, value]) => (
                    <li key={key} className="flex justify-between rounded-lg bg-muted px-3 py-2">
                      <span className="text-muted-foreground">{COUNT_LABELS[key] ?? key}</span>
                      <span className="font-medium">{value}</span>
                    </li>
                  ))}
                </ul>
                {preview.open_invoices.length > 0 ? (
                  <p className="text-sm font-medium">
                    {preview.open_invoices.length} facture(s) ouverte(s) à résoudre.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune facture ouverte.</p>
                )}
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-4">
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">Motif de clôture</legend>
                  {(Object.keys(CLOSURE_TYPE_LABELS) as ClosureType[]).map((type) => (
                    <label key={type} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="closure-type"
                        value={type}
                        checked={draft.closureType === type}
                        onChange={() => setDraft((current) => ({ ...current, closureType: type }))}
                      />
                      {CLOSURE_TYPE_LABELS[type]}
                    </label>
                  ))}
                  {errorFor('closureType') ? (
                    <p className="text-sm text-destructive">{errorFor('closureType')}</p>
                  ) : null}
                </fieldset>

                <div className="space-y-1">
                  <label htmlFor="closure-reason" className="text-sm font-medium">
                    Description de la clôture (10 caractères minimum)
                  </label>
                  <textarea
                    id="closure-reason"
                    ref={(node) => {
                      if (errorFor('reason')) firstInvalidRef.current = node
                    }}
                    className="w-full rounded-lg border border-border bg-background p-2 text-sm"
                    rows={4}
                    value={draft.reason}
                    aria-invalid={Boolean(errorFor('reason'))}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, reason: event.target.value }))
                    }
                  />
                  {errorFor('reason') ? (
                    <p className="text-sm text-destructive">{errorFor('reason')}</p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-4">
                {preview.open_invoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucune facture ouverte : rien à résoudre.
                  </p>
                ) : null}
                {preview.open_invoices.map((invoice) => {
                  const resolved = summarizeResolvedAmount(draft.resolutions, invoice.id)
                  const invoiceError = errorFor(`invoice:${invoice.id}`)
                  return (
                    <article
                      key={invoice.id}
                      className="space-y-3 rounded-xl border border-border p-4"
                    >
                      <header className="flex items-baseline justify-between">
                        <h3 className="text-sm font-semibold">
                          {invoice.reference ?? invoice.id}
                        </h3>
                        <p className="text-sm">
                          Solde restant : <strong>{fcfa(invoice.remaining)}</strong>
                        </p>
                      </header>

                      {draft.resolutions.map((resolution, index) =>
                        resolution.invoiceId !== invoice.id ? null : (
                          <div key={index} className="space-y-2 rounded-lg bg-muted p-3">
                            <div className="grid gap-2 sm:grid-cols-2">
                              <div className="space-y-1">
                                <label
                                  htmlFor={`resolution-type-${index}`}
                                  className="text-xs font-medium"
                                >
                                  Type de résolution
                                </label>
                                <select
                                  id={`resolution-type-${index}`}
                                  className="w-full rounded-lg border border-border bg-background p-2 text-sm"
                                  value={resolution.type}
                                  onChange={(event) =>
                                    updateResolution(index, {
                                      type: event.target.value as InvoiceResolutionType,
                                    })
                                  }
                                >
                                  {invoice.allowed_resolutions.map((type) => (
                                    <option key={type} value={type}>
                                      {RESOLUTION_LABELS[type]}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label
                                  htmlFor={`resolution-amount-${index}`}
                                  className="text-xs font-medium"
                                >
                                  Montant (FCFA)
                                </label>
                                <input
                                  id={`resolution-amount-${index}`}
                                  type="number"
                                  min={1}
                                  step={1}
                                  className="w-full rounded-lg border border-border bg-background p-2 text-sm"
                                  value={Number.isFinite(resolution.amount) ? resolution.amount : ''}
                                  aria-invalid={Boolean(invoiceError)}
                                  ref={(node) => {
                                    if (invoiceError && !firstInvalidRef.current) {
                                      firstInvalidRef.current = node
                                    }
                                  }}
                                  onChange={(event) =>
                                    updateResolution(index, {
                                      amount: Number.parseInt(event.target.value, 10),
                                    })
                                  }
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label
                                htmlFor={`resolution-reason-${index}`}
                                className="text-xs font-medium"
                              >
                                Justification
                              </label>
                              <input
                                id={`resolution-reason-${index}`}
                                type="text"
                                className="w-full rounded-lg border border-border bg-background p-2 text-sm"
                                value={resolution.reason}
                                onChange={(event) =>
                                  updateResolution(index, { reason: event.target.value })
                                }
                              />
                            </div>

                            {resolution.type === 'credit_note' ? (
                              <div className="space-y-1">
                                <label
                                  htmlFor={`resolution-reference-${index}`}
                                  className="text-xs font-medium"
                                >
                                  Référence de l’avoir (obligatoire)
                                </label>
                                <input
                                  id={`resolution-reference-${index}`}
                                  type="text"
                                  className="w-full rounded-lg border border-border bg-background p-2 text-sm"
                                  value={resolution.externalReference ?? ''}
                                  onChange={(event) =>
                                    updateResolution(index, {
                                      externalReference: event.target.value,
                                    })
                                  }
                                />
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="space-y-1">
                                  <label
                                    htmlFor={`resolution-evidence-${index}`}
                                    className="text-xs font-medium"
                                  >
                                    Lien de preuve (ou attestation ci-dessous)
                                  </label>
                                  <input
                                    id={`resolution-evidence-${index}`}
                                    type="url"
                                    className="w-full rounded-lg border border-border bg-background p-2 text-sm"
                                    value={resolution.evidenceUrl ?? ''}
                                    onChange={(event) =>
                                      updateResolution(index, { evidenceUrl: event.target.value })
                                    }
                                  />
                                </div>
                                <label className="flex items-center gap-2 text-xs">
                                  <input
                                    type="checkbox"
                                    checked={resolution.managerAttestation === true}
                                    onChange={(event) =>
                                      updateResolution(index, {
                                        managerAttestation: event.target.checked,
                                      })
                                    }
                                  />
                                  J’atteste en tant que responsable que cette créance est
                                  irrécouvrable.
                                </label>
                              </div>
                            )}

                            {draft.resolutions.filter((r) => r.invoiceId === invoice.id).length >
                            1 ? (
                              <button
                                type="button"
                                className="text-xs underline"
                                onClick={() => removeResolution(index)}
                              >
                                Retirer cette résolution
                              </button>
                            ) : null}
                          </div>
                        ),
                      )}

                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          className="text-xs underline"
                          onClick={() => addResolution(invoice.id)}
                        >
                          Ajouter une seconde résolution
                        </button>
                        <p className="text-xs text-muted-foreground">
                          Résolu : {fcfa(resolved)} / {fcfa(invoice.remaining)}
                        </p>
                      </div>

                      {invoiceError ? (
                        <p className="text-sm text-destructive">{invoiceError}</p>
                      ) : null}
                    </article>
                  )
                })}
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-3">
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Motif</dt>
                    <dd>{draft.closureType ? CLOSURE_TYPE_LABELS[draft.closureType] : '—'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Factures résolues</dt>
                    <dd>{preview.open_invoices.length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Avoirs / créances</dt>
                    <dd>{draft.resolutions.length}</dd>
                  </div>
                </dl>
                <p className="text-sm text-muted-foreground">
                  Un avoir ou une créance abandonnée rend la clôture irréversible.
                </p>
                <div className="space-y-1">
                  <label htmlFor="closure-confirmation" className="text-sm font-medium">
                    Saisissez « {projectReference} » pour confirmer
                  </label>
                  <input
                    id="closure-confirmation"
                    type="text"
                    autoComplete="off"
                    className="w-full rounded-lg border border-border bg-background p-2 text-sm"
                    value={draft.confirmationReference}
                    aria-invalid={Boolean(errorFor('confirmationReference'))}
                    ref={(node) => {
                      if (errorFor('confirmationReference')) firstInvalidRef.current = node
                    }}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        confirmationReference: event.target.value,
                      }))
                    }
                  />
                  {errorFor('confirmationReference') ? (
                    <p className="text-sm text-destructive">
                      {errorFor('confirmationReference')}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <footer className="flex items-center justify-between gap-2 pt-2">
          <button type="button" className="text-sm underline" onClick={close}>
            Annuler
          </button>
          <div className="flex items-center gap-2">
            {step > 1 ? (
              <Button
                variant="outline"
                onClick={() => {
                  setShowErrors(false)
                  setStep((current) => Math.max(1, current - 1))
                }}
              >
                Précédent
              </Button>
            ) : null}
            {step < 4 ? (
              <Button onClick={goNext} disabled={!preview}>
                Suivant
              </Button>
            ) : (
              <Button onClick={submit} disabled={submitting || !validation.canSubmit}>
                {submitting ? 'Clôture en cours…' : 'Confirmer la clôture'}
              </Button>
            )}
          </div>
        </footer>
      </section>
    </div>
  )
}
