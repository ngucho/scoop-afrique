import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  closureErrorMessage,
  newIdempotencyKey,
  toClosurePayload,
  validateClosureDraft,
  type ClosureDraft,
  type ClosurePreview,
} from './project-closure.js'

const PROJECT_REFERENCE = 'PRJ-0042'

const preview: ClosurePreview = {
  closure_version: 3,
  fingerprint: `sha256:${'a'.repeat(64)}`,
  requires_reconciliation: false,
  open_invoices: [
    {
      id: 'invoice-1',
      reference: 'FAC-0001',
      remaining: 200_000,
      allowed_resolutions: ['credit_note', 'bad_debt'],
    },
  ],
  counts: { devis: 1, invoices: 2, contracts: 0, tasks: 3, reminders: 0 },
}

const validDraft = (overrides: Partial<ClosureDraft> = {}): ClosureDraft => ({
  closureType: 'client_abandoned',
  reason: 'Le client a définitivement abandonné le projet.',
  resolutions: [
    {
      invoiceId: 'invoice-1',
      type: 'bad_debt',
      amount: 200_000,
      reason: 'Créance irrécouvrable après relances',
      managerAttestation: true,
    },
  ],
  confirmationReference: PROJECT_REFERENCE,
  ...overrides,
})

test('a complete draft can be submitted', () => {
  const result = validateClosureDraft(preview, validDraft(), PROJECT_REFERENCE)
  assert.equal(result.canSubmit, true)
  assert.deepEqual(result.errors, {})
  assert.equal(result.firstInvalidStep, null)
})

test('an incomplete invoice resolution blocks submission', () => {
  const result = validateClosureDraft(
    preview,
    validDraft({ resolutions: [] }),
    PROJECT_REFERENCE,
  )

  assert.equal(result.canSubmit, false)
  assert.equal(result.errors['invoice:invoice-1'], 'Cette facture ouverte doit être résolue.')
  assert.equal(result.firstInvalidStep, 3)
})

test('a resolution amount must equal the remaining balance exactly', () => {
  const short = validateClosureDraft(
    preview,
    validDraft({
      resolutions: [
        {
          invoiceId: 'invoice-1',
          type: 'bad_debt',
          amount: 199_999,
          reason: 'Créance irrécouvrable',
          managerAttestation: true,
        },
      ],
    }),
    PROJECT_REFERENCE,
  )
  assert.equal(short.canSubmit, false)
  assert.match(short.errors['invoice:invoice-1'], /exactement 200000 FCFA/)

  const split = validateClosureDraft(
    preview,
    validDraft({
      resolutions: [
        {
          invoiceId: 'invoice-1',
          type: 'credit_note',
          amount: 120_000,
          reason: 'Prestation non réalisée',
          externalReference: 'AV-2026-014',
        },
        {
          invoiceId: 'invoice-1',
          type: 'bad_debt',
          amount: 80_000,
          reason: 'Solde irrécouvrable',
          managerAttestation: true,
        },
      ],
    }),
    PROJECT_REFERENCE,
  )
  assert.equal(split.canSubmit, true)
})

test('a credit note requires its external reference', () => {
  const result = validateClosureDraft(
    preview,
    validDraft({
      resolutions: [
        {
          invoiceId: 'invoice-1',
          type: 'credit_note',
          amount: 200_000,
          reason: 'Prestation non réalisée',
        },
      ],
    }),
    PROJECT_REFERENCE,
  )

  assert.equal(result.canSubmit, false)
  assert.equal(result.errors['invoice:invoice-1'], 'Un avoir exige sa référence externe.')
})

test('a bad debt requires evidence or a manager attestation', () => {
  const result = validateClosureDraft(
    preview,
    validDraft({
      resolutions: [
        {
          invoiceId: 'invoice-1',
          type: 'bad_debt',
          amount: 200_000,
          reason: 'Créance irrécouvrable',
        },
      ],
    }),
    PROJECT_REFERENCE,
  )

  assert.equal(result.canSubmit, false)
  assert.match(result.errors['invoice:invoice-1'], /preuve ou l’attestation/)
})

test('a short reason and a missing closure type block step 2', () => {
  const result = validateClosureDraft(
    preview,
    validDraft({ closureType: null, reason: 'court' }),
    PROJECT_REFERENCE,
  )

  assert.equal(result.canSubmit, false)
  assert.ok(result.errors.closureType)
  assert.ok(result.errors.reason)
  assert.equal(result.firstInvalidStep, 2)
})

test('the typed project reference must match exactly', () => {
  for (const typed of ['prj-0042', 'PRJ-004', ' PRJ-0042', '']) {
    const result = validateClosureDraft(
      preview,
      validDraft({ confirmationReference: typed }),
      PROJECT_REFERENCE,
    )
    assert.equal(result.canSubmit, false, `"${typed}" must not be accepted`)
    assert.ok(result.errors.confirmationReference)
  }
})

test('a folder with no open invoice only needs motive, reason and confirmation', () => {
  const clean: ClosurePreview = { ...preview, open_invoices: [] }
  const result = validateClosureDraft(
    clean,
    validDraft({ resolutions: [] }),
    PROJECT_REFERENCE,
  )
  assert.equal(result.canSubmit, true)
})

test('the payload carries the preview version and fingerprint', () => {
  const payload = toClosurePayload(preview, validDraft())

  assert.equal(payload.closure_version, 3)
  assert.equal(payload.preview_fingerprint, preview.fingerprint)
  assert.deepEqual(payload.invoice_resolutions, [
    {
      invoice_id: 'invoice-1',
      type: 'bad_debt',
      amount: 200_000,
      reason: 'Créance irrécouvrable après relances',
      manager_attestation: true,
    },
  ])
})

test('optional resolution fields are omitted rather than sent empty', () => {
  const payload = toClosurePayload(
    preview,
    validDraft({
      resolutions: [
        {
          invoiceId: 'invoice-1',
          type: 'credit_note',
          amount: 200_000,
          reason: 'Prestation non réalisée',
          externalReference: 'AV-2026-014',
          evidenceUrl: '   ',
        },
      ],
    }),
  )
  const [resolution] = payload.invoice_resolutions as Array<Record<string, unknown>>

  assert.equal(resolution.external_reference, 'AV-2026-014')
  assert.equal('evidence_url' in resolution, false)
  assert.equal('manager_attestation' in resolution, false)
})

test('idempotency keys are unique and UUID-shaped', () => {
  const keys = new Set(Array.from({ length: 20 }, () => newIdempotencyKey()))
  assert.equal(keys.size, 20)
  for (const key of keys) {
    assert.match(key, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  }
})

test('backend error codes are translated for the operator', () => {
  assert.match(closureErrorMessage('CLOSURE_PREVIEW_STALE', 'x'), /Rechargez l’aperçu/)
  assert.match(closureErrorMessage('PROJECT_RESTORE_FORBIDDEN', 'x'), /ne peut plus être rouvert/)
  assert.equal(closureErrorMessage(undefined, 'repli'), 'repli')
  assert.equal(closureErrorMessage('UNKNOWN_CODE', 'repli'), 'repli')
})

// ── Présentation : contrôles structurels sur les composants ─────────────────

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')

const wizard = read('../components/projects/ProjectClosureWizard.tsx')
const banner = read('../components/projects/ProjectArchivedBanner.tsx')
const reconciliation = read('../components/projects/ProjectArchiveReconciliation.tsx')
const projectPage = read('../app/(protected)/projects/[id]/page.tsx')
const projectsPage = read('../app/(protected)/projects/page.tsx')

test('the wizard is accessible and never uses native dialogs', () => {
  assert.doesNotMatch(wizard, /\b(?:window\.)?(?:prompt|confirm|alert)\(/)
  assert.match(wizard, /aria-live/)
  assert.match(wizard, /<label/)
  assert.match(wizard, /<button/)
  assert.match(wizard, /focus\(\)/)
})

test('the wizard posts through the dedicated idempotent helper', () => {
  assert.match(wizard, /closeProjectFolder\(/)
  assert.match(wizard, /newIdempotencyKey\(\)/)
  assert.match(wizard, /validateClosureDraft\(/)
})

test('an archived folder renders no mutation action', () => {
  // Le bandeau remplace les actions : ni édition, ni changement de statut,
  // ni clôture directe.
  assert.doesNotMatch(banner, /ProjectStatusActions|ProjectCloseButton|projects\/\$\{[^}]*\}\/edit/)
  assert.match(projectPage, /isArchived \? \(/)
  assert.match(projectPage, /ProjectArchivedBanner/)
})

test('a sealed archive offers a follow-up project and never a restore', () => {
  assert.match(banner, /Créer un nouveau projet lié/)
  assert.match(banner, /create-follow-up/)
  assert.doesNotMatch(banner, /\/restore/)
})

test('a follow-up project links back to its predecessor', () => {
  assert.match(projectPage, /predecessor_project_id/)
})

test('the legacy archive list only exposes the reconciliation action', () => {
  assert.match(reconciliation, /requires_reconciliation|archive-reconciliation/)
  assert.match(projectsPage, /ProjectArchiveReconciliation/)
})
